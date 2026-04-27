import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { runPreflight } from "../lib/preflight";
import { buildWeatherContext } from "../lib/weather";
import {
  generateWeatherBlogPost,
  generateServiceBlogPost,
} from "../lib/content-generator";
import { pushPostToGitHub } from "../lib/github";
import {
  getRotationState,
  getNextWeatherCity,
  getNextServiceAndCity,
  saveRotationState,
} from "../lib/rotation";
import { siteConfig, services, serviceAreaCities } from "../lib/site-config";
import type { ServiceConfig, CityConfig } from "../lib/site-config";
import type { ServiceBlogContext, RotationState } from "../lib/types";

// --- CLI argument parsing ---
const args = process.argv.slice(2);

function getArgValue(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

const postType = getArgValue("--type") || "weather";
const cityOverride = getArgValue("--city");
const serviceOverride = getArgValue("--service");
const shouldPush = args.includes("--push");

function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

async function main() {
  console.log("=== Outdoor Renovations Blog Generator ===\n");
  console.log(`Post type: ${postType}`);
  if (cityOverride) console.log(`City override: ${cityOverride}`);
  if (serviceOverride) console.log(`Service override: ${serviceOverride}`);
  console.log(`Push to GitHub: ${shouldPush}\n`);

  // Validate every external dependency BEFORE the expensive Claude call.
  // If a key is dead or rate-limited, fail fast with a remediation message
  // instead of burning a full generation cycle to discover it deep in the SDK.
  await runPreflight();

  // Fetch weather context (used by both types)
  console.log("Fetching weather data for Austin, TX...");
  const weatherContext = await buildWeatherContext();
  console.log(`Mode: ${weatherContext.mode}`);
  console.log(`Week: ${weatherContext.weekLabel}`);
  console.log(`Dominant hazard: ${weatherContext.dominantHazard}`);
  console.log(`Affected services: ${weatherContext.affectedServices.join(", ")}`);
  console.log(`Historical: ${weatherContext.historicalSummary}`);
  console.log(`Forecast: ${weatherContext.forecastSummary}\n`);

  let blog;
  // Holds the advanced rotation state to persist after a successful push.
  // Stays undefined when both city and service are user-overridden (manual runs).
  let pendingStateUpdate: RotationState | undefined;

  if (postType === "weather") {
    // --- Weather blog ---
    const state = await getRotationState();
    let targetCity: CityConfig;
    if (cityOverride) {
      const match = serviceAreaCities.find(
        (c) => c.name.toLowerCase() === cityOverride.toLowerCase()
      );
      if (!match) { console.error(`City "${cityOverride}" not found.`); process.exit(1); }
      targetCity = match;
    } else {
      const next = getNextWeatherCity(state);
      targetCity = next.city;
      pendingStateUpdate = next.updatedState;
    }
    console.log(`Target city: ${targetCity.name}`);
    console.log("Generating weather blog post with Claude...");
    blog = await generateWeatherBlogPost(weatherContext, targetCity);
  } else if (postType === "service") {
    // --- Service blog ---
    const state = await getRotationState();
    let service: ServiceConfig;
    let city: CityConfig;

    if (serviceOverride) {
      const match = services.find(
        (s) => s.name.toLowerCase() === serviceOverride.toLowerCase()
      );
      if (!match) {
        console.error(
          `Service "${serviceOverride}" not found. Available services:`
        );
        services.forEach((s) => console.error(`  - ${s.name}`));
        process.exit(1);
      }
      service = match;
      if (cityOverride) {
        const cMatch = serviceAreaCities.find(
          (c) => c.name.toLowerCase() === cityOverride.toLowerCase()
        );
        if (!cMatch) { console.error(`City "${cityOverride}" not found.`); process.exit(1); }
        city = cMatch;
      } else {
        const next = getNextWeatherCity(state);
        city = next.city;
        pendingStateUpdate = next.updatedState;
      }
    } else {
      const next = getNextServiceAndCity(state);
      service = next.service;
      if (cityOverride) {
        city = serviceAreaCities.find((c) => c.name.toLowerCase() === cityOverride.toLowerCase()) || next.city;
      } else {
        city = next.city;
      }
      pendingStateUpdate = next.updatedState;
    }

    const season = getCurrentSeason();
    console.log(`Service: ${service.name}`);
    console.log(`Target city: ${city.name}`);
    console.log(`Season: ${season}`);

    const serviceContext: ServiceBlogContext = {
      service,
      targetCity: city,
      season,
      weatherContext,
    };

    console.log("Generating service blog post with Claude...");
    blog = await generateServiceBlogPost(serviceContext);
  } else {
    console.error(`Unknown post type: "${postType}". Use --type weather or --type service`);
    process.exit(1);
  }

  console.log(`\nTitle: ${blog.frontmatter.title}`);
  console.log(`Slug: ${blog.frontmatter.slug}`);
  console.log(`Category: ${blog.frontmatter.category}`);
  console.log(`Tags: ${blog.frontmatter.tags.join(", ")}`);
  console.log(`FAQs: ${blog.frontmatter.schema.faqItems.length} items\n`);

  // Save locally
  const postsDir = path.join(process.cwd(), "content/posts");
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const filePath = path.join(process.cwd(), blog.filePath);
  fs.writeFileSync(filePath, blog.markdownContent);
  console.log(`Saved locally: ${filePath}`);

  // Push to GitHub if --push flag
  if (shouldPush) {
    console.log("\nPushing to GitHub...");
    const githubUrl = await pushPostToGitHub(blog);
    console.log(`Pushed: ${githubUrl}`);

    // Advance and persist rotation state ONLY after a successful push, and only
    // when no override was supplied (manual override runs must not consume the
    // rotation slot). This was the missing call that caused successive runs to
    // re-pick the same city — see post-mortem 2026-04-27.
    if (pendingStateUpdate) {
      await saveRotationState(pendingStateUpdate);
      console.log(
        `Rotation advanced — weatherCityIndex=${pendingStateUpdate.weatherCityIndex}, serviceIndex=${pendingStateUpdate.serviceIndex}, serviceCityIndex=${pendingStateUpdate.serviceCityIndex}`
      );
    }
  }

  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
