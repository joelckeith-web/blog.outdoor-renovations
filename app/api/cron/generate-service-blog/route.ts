import { NextRequest, NextResponse } from "next/server";
import { getRotationState, saveRotationState } from "@/lib/rotation";
import { getNextServiceAndCity } from "@/lib/rotation";
import { buildWeatherContext } from "@/lib/weather";
import { generateServiceBlogPost } from "@/lib/content-generator";
import { pushPostToGitHub } from "@/lib/github";
import type { ServiceBlogContext } from "@/lib/types";

/**
 * Determine current season from the month.
 * Spring: Mar-May, Summer: Jun-Aug, Fall: Sep-Nov, Winter: Dec-Feb
 */
function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting service blog generation...");

    // Step 1: Get rotation state and next service + city
    const state = await getRotationState();
    const { service, city, updatedState } = getNextServiceAndCity(state);
    console.log(`[CRON] Service: ${service.name}`);
    console.log(`[CRON] Target city: ${city.name}`);

    // Step 2: Build weather context for seasonal tie-in
    const weatherContext = await buildWeatherContext();
    console.log(`[CRON] Weather mode: ${weatherContext.mode}`);

    // Step 3: Determine current season
    const season = getCurrentSeason();
    console.log(`[CRON] Season: ${season}`);

    // Step 4: Build service blog context
    const serviceContext: ServiceBlogContext = {
      service,
      targetCity: city,
      season,
      weatherContext,
    };

    // Step 5: Generate content with Claude
    const blog = await generateServiceBlogPost(serviceContext);
    console.log(`[CRON] Generated: "${blog.frontmatter.title}"`);
    console.log(`[CRON] File: ${blog.filePath}`);

    // Step 6: Push to GitHub
    const githubUrl = await pushPostToGitHub(blog);
    console.log(`[CRON] Pushed to GitHub: ${githubUrl}`);

    // Step 7: Update rotation state
    await saveRotationState(updatedState);
    console.log(`[CRON] Rotation state updated — serviceIndex: ${updatedState.serviceIndex}, serviceCityIndex: ${updatedState.serviceCityIndex}`);

    return NextResponse.json({
      success: true,
      post: {
        title: blog.frontmatter.title,
        slug: blog.frontmatter.slug,
        service: service.name,
        targetCity: city.name,
      },
      githubUrl,
    });
  } catch (error) {
    console.error("[CRON] Service blog generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate service blog post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
