import { NextRequest, NextResponse } from "next/server";
import { getRotationState, saveRotationState } from "@/lib/rotation";
import { getNextWeatherCity } from "@/lib/rotation";
import { buildWeatherContext } from "@/lib/weather";
import { generateWeatherBlogPost } from "@/lib/content-generator";
import { pushPostToGitHub } from "@/lib/github";

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

    // Step 2: Build weather context for the target city
    const weatherContext = await buildWeatherContext();
    console.log(`[CRON] Mode: ${weatherContext.mode}`);
    console.log(`[CRON] Dominant hazard: ${weatherContext.dominantHazard}`);
    console.log(`[CRON] Affected services: ${weatherContext.affectedServices.join(", ")}`);
    console.log(`[CRON] Week: ${weatherContext.weekLabel}`);

    // Step 3: Generate content with Claude
    const blog = await generateWeatherBlogPost(weatherContext, targetCity);
    console.log(`[CRON] Generated: "${blog.frontmatter.title}"`);
    console.log(`[CRON] File: ${blog.filePath}`);

    // Step 4: Push to GitHub
    const githubUrl = await pushPostToGitHub(blog);
    console.log(`[CRON] Pushed to GitHub: ${githubUrl}`);

    // Step 5: Update rotation state
    await saveRotationState(updatedState);
    console.log(`[CRON] Rotation state updated — weatherCityIndex: ${updatedState.weatherCityIndex}`);

    return NextResponse.json({
      success: true,
      post: {
        title: blog.frontmatter.title,
        slug: blog.frontmatter.slug,
        targetCity: targetCity.name,
        weatherMode: blog.frontmatter.weatherMode,
      },
      weather: {
        mode: weatherContext.mode,
        dominantHazard: weatherContext.dominantHazard,
        forecast: weatherContext.forecastSummary,
      },
      githubUrl,
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
