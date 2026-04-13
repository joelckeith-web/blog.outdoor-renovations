import { NextRequest, NextResponse } from "next/server";
import { getRotationState, saveRotationState } from "@/lib/rotation";
import { getNextWeatherCity } from "@/lib/rotation";
import { buildWeatherContext } from "@/lib/weather";
import { generateWeatherBlogPost } from "@/lib/content-generator";
import { pushPostToGitHub } from "@/lib/github";
import { siteConfig } from "@/lib/site-config";
import { getPhotoRegistry, selectPhotoForPost, markPhotoUsed, savePhotoRegistry } from "@/lib/photo-registry";

/**
 * Submit a URL to Google's Indexing API for fast indexing.
 * Only works for pages with BroadcastEvent or JobPosting schema.
 */
async function submitToIndexingApi(url: string): Promise<boolean> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.log("[INDEXING] Google Indexing API credentials not set, skipping");
    return false;
  }

  try {
    // Build JWT for Google Indexing API
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const claim = btoa(
      JSON.stringify({
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/indexing",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );

    // Import the private key and sign
    const key = privateKey.replace(/\\n/g, "\n");
    const encoder = new TextEncoder();
    const keyData = key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureInput = encoder.encode(`${header}.${claim}`);
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureInput
    );
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const jwt = `${header}.${claim}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[INDEXING] Failed to get access token:", tokenData);
      return false;
    }

    // Submit URL for indexing
    const indexRes = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          url,
          type: "URL_UPDATED",
        }),
      }
    );

    const indexData = await indexRes.json();
    console.log(`[INDEXING] Submitted ${url}:`, JSON.stringify(indexData));
    return indexRes.ok;
  } catch (err) {
    console.error("[INDEXING] Error submitting to Indexing API:", err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting weather-triggered blog generation...");

    // Step 1: Get rotation state and target city
    const state = await getRotationState();
    const { city: targetCity, updatedState } = getNextWeatherCity(state);
    console.log(`[CRON] Target city: ${targetCity.name}`);

    // A/B test: even rotation index = BroadcastEvent schema + Indexing API
    const useBroadcastEvent = state.weatherCityIndex % 2 === 0;
    console.log(`[CRON] BroadcastEvent A/B: ${useBroadcastEvent ? "WITH" : "WITHOUT"} (index: ${state.weatherCityIndex})`);

    // Step 2: Build weather context for the target city
    const weatherContext = await buildWeatherContext();
    console.log(`[CRON] Mode: ${weatherContext.mode}`);
    console.log(`[CRON] Dominant hazard: ${weatherContext.dominantHazard}`);
    console.log(`[CRON] Affected services: ${weatherContext.affectedServices.join(", ")}`);
    console.log(`[CRON] Week: ${weatherContext.weekLabel}`);

    // Step 2.5: Select a featured photo from the registry
    let photoUrl: string | undefined;
    let photoAlt: string | undefined;
    try {
      const photoRegistry = await getPhotoRegistry();
      const selectedPhoto = selectPhotoForPost(
        photoRegistry,
        weatherContext.affectedServices[0] || "general",
        state.recentlyUsedPhotoIds || []
      );
      if (selectedPhoto) {
        photoUrl = selectedPhoto.blobUrl;
        photoAlt = selectedPhoto.alt;
        const updatedRegistry = markPhotoUsed(photoRegistry, selectedPhoto.id);
        await savePhotoRegistry(updatedRegistry);
        updatedState.recentlyUsedPhotoIds = [
          selectedPhoto.id,
          ...(state.recentlyUsedPhotoIds || []).slice(0, 21),
        ];
        console.log(`[CRON] Selected photo: ${selectedPhoto.filename} (${selectedPhoto.category})`);
      } else {
        console.log("[CRON] No photos in registry, using fallback images");
      }
    } catch (err) {
      console.warn("[CRON] Photo selection failed, using fallback:", err);
    }

    // Step 3: Generate content with Claude (passes BroadcastEvent flag + photo)
    const blog = await generateWeatherBlogPost(weatherContext, targetCity, useBroadcastEvent, photoUrl, photoAlt);
    console.log(`[CRON] Generated: "${blog.frontmatter.title}"`);
    console.log(`[CRON] File: ${blog.filePath}`);

    // Step 4: Push to GitHub
    const githubUrl = await pushPostToGitHub(blog);
    console.log(`[CRON] Pushed to GitHub: ${githubUrl}`);

    // Step 5: Update rotation state
    await saveRotationState(updatedState);
    console.log(`[CRON] Rotation state updated — weatherCityIndex: ${updatedState.weatherCityIndex}`);

    // Step 6: Submit to Google Indexing API if BroadcastEvent is enabled
    let indexingResult = null;
    if (useBroadcastEvent) {
      const postUrl = `${siteConfig.blogUrl}/blog/${blog.frontmatter.slug}`;
      console.log(`[CRON] Submitting to Google Indexing API: ${postUrl}`);
      const indexed = await submitToIndexingApi(postUrl);
      indexingResult = indexed ? "submitted" : "failed";
      console.log(`[CRON] Indexing API result: ${indexingResult}`);
    }

    return NextResponse.json({
      success: true,
      post: {
        title: blog.frontmatter.title,
        slug: blog.frontmatter.slug,
        targetCity: targetCity.name,
        weatherMode: blog.frontmatter.weatherMode,
        useBroadcastEvent,
      },
      weather: {
        mode: weatherContext.mode,
        dominantHazard: weatherContext.dominantHazard,
        forecast: weatherContext.forecastSummary,
      },
      githubUrl,
      indexingResult,
    });
  } catch (error) {
    console.error("[CRON] Weather blog generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weather blog post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
