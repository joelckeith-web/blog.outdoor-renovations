import Anthropic from "@anthropic-ai/sdk";
import type {
  WeatherContext,
  WeatherMode,
  BlogFrontmatter,
  GeneratedBlog,
  ServiceAreaLink,
  ServiceBlogContext,
} from "./types";
import type { CityConfig } from "./site-config";
import { getBlogFeaturedImage } from "./site-config";
import {
  siteConfig,
  services,
  serviceAreaCities,
  getServicePageUrl,
  getLocationPageUrl,
  getServiceLocationUrl,
} from "./site-config";

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// =============================================================
//  WEATHER-TRIGGERED BLOG POST
// =============================================================

/**
 * Generate a weather-triggered blog post from the full weather context.
 * Enforces Core Content Creation SOP requirements.
 *
 * Supports three modes:
 * - pre-event:  Preparation-focused ("freeze is coming, protect your plants")
 * - post-event: Recovery-focused  ("storm hit, here's what to check now")
 * - combined:   Both past event AND more weather incoming
 */
export async function generateWeatherBlogPost(
  context: WeatherContext,
  targetCity: CityConfig
): Promise<GeneratedBlog> {
  const internalLinks = buildInternalLinksContext(targetCity);
  const geoFooterLinks = buildGeoFooterLinks(
    services.map((s) => s.slug),
    targetCity
  );

  const systemPrompt = buildWeatherSystemPrompt(context.mode);
  const userPrompt = buildWeatherUserPrompt(
    context,
    targetCity,
    internalLinks,
    geoFooterLinks
  );

  const response = await getAnthropicClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseGeneratedContent(rawContent, "weather", targetCity.name, {
    weatherTriggered: true,
    weatherMode: context.mode,
    weatherWeek: context.weekLabel,
    geoFooterLinks,
    primaryService: context.affectedServices[0],
  });
}

// =============================================================
//  SERVICE-FOCUSED BLOG POST
// =============================================================

/**
 * Generate a deep-dive service blog post with seasonal tie-in.
 */
export async function generateServiceBlogPost(
  serviceContext: ServiceBlogContext
): Promise<GeneratedBlog> {
  const { service, targetCity, season, weatherContext } = serviceContext;

  const internalLinks = buildInternalLinksContext(targetCity);
  const geoFooterLinks = buildGeoFooterLinks(
    services.map((s) => s.slug),
    targetCity
  );

  const systemPrompt = buildServiceSystemPrompt(service.name, season);
  const userPrompt = buildServiceUserPrompt(
    service,
    targetCity,
    season,
    weatherContext,
    internalLinks,
    geoFooterLinks
  );

  const response = await getAnthropicClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseGeneratedContent(rawContent, "service", targetCity.name, {
    weatherTriggered: false,
    weatherMode: weatherContext.mode,
    weatherWeek: weatherContext.weekLabel,
    geoFooterLinks,
    primaryService: service.slug,
  });
}

// =============================================================
//  WEATHER SYSTEM PROMPT
// =============================================================

function buildWeatherSystemPrompt(mode: WeatherMode): string {
  const modeInstructions = getWeatherModeInstructions(mode);

  return `You are a professional SEO content writer for ${siteConfig.companyName}, a licensed landscape contractor in ${siteConfig.serviceArea} since ${siteConfig.foundedYear}. The company is owned by ${siteConfig.ownerName} and has completed ${siteConfig.projectsCompleted} projects with a ${siteConfig.averageRating}-star rating. They are fully bonded and insured with a 1-year service guarantee. Their motto is "${siteConfig.motto}" and tagline is "${siteConfig.tagline}." You write weather-triggered blog posts that connect real local weather conditions to landscaping service needs.

KEY CENTRAL TEXAS LANDSCAPING FACTS (use naturally in content):
- Austin summers can exceed ${siteConfig.keyFacts.austinSummersExceed}
- Soil types: ${siteConfig.keyFacts.soilTypes}
- ${siteConfig.keyFacts.waterRestrictions}
- Smart irrigation controllers provide ${siteConfig.keyFacts.smartControllerSavings}
- Quality landscaping delivers ${siteConfig.keyFacts.landscapeROI}
- Average annual rainfall: ${siteConfig.keyFacts.avgAnnualRainfall}
- Growing seasons: ${siteConfig.keyFacts.growingSeasons}
- Native plant options: ${siteConfig.keyFacts.nativePlants}
- Hardscape installation: ${siteConfig.keyFacts.hardscapeSeasons}

CONTENT MODE: ${mode.toUpperCase()}
${modeInstructions}

STRICT CONTENT RULES (Core Content Creation SOP):
1. Write exactly 1,500-2,200 words of verified, substantive content. No filler.
2. Include the primary keyword in the H1 title and within the first 100 words.
3. Introduce the business entity "${siteConfig.companyName}" in the first paragraph.
4. Include 4 or more internal links to verified service pages (provided below).
5. Include 2 or more external Tier 1 links -- ONLY to .gov, .edu, or established industry authorities.
6. Add "Key Takeaway" callout blocks after every 2-3 H2 sections.
7. Include 6 or more FAQ items at the end, structured for FAQPage schema.
8. Do NOT fabricate statistics, credentials, certifications, or customer stories.
9. Reference Austin, Central Texas, and Hill Country service areas by name.
10. Reference the ACTUAL weather data (historical and/or forecast) with specific dates.
11. Include a CTA paragraph at the end with phone number ${siteConfig.phone}.
12. Write in a professional but approachable tone -- like a knowledgeable neighbor.

CRITICAL -- IMMEDIATE ACTION SUMMARY BOX:
Your FIRST content after the intro paragraph MUST be a summary box block formatted EXACTLY like this:

> **Immediate Action Summary for [City] Homeowners**
> [Write a 75-100 word summary that directly answers the implied search query. This text must be self-contained, factual, and parseable by AI Overview systems. Include the business name, city, specific weather condition, and recommended action. Do NOT use marketing fluff -- write like a factual advisory.]

This summary box is critical for AI Overview / Answer Engine Optimization (AEO). It must appear within the first 2 scroll-lengths of the page.

OUTPUT FORMAT -- respond with EXACTLY this structure (use the delimiters precisely):

===TITLE===
[SEO-optimized H1 title, 50-70 characters]
===META_TITLE===
[Title tag, 50-60 characters]
===META_DESCRIPTION===
[Meta description, 150-160 characters]
===CATEGORY===
[One of: landscape-design, hardscaping, custom-carpentry, softscaping-planting, irrigation-drainage, landscape-lighting, metal-fabrication, property-management, general]
===TAGS===
[Comma-separated tags]
===FAQ_JSON===
[JSON array of {question, answer} objects -- minimum 6 items]
===CONTENT===
[Full Markdown blog post content starting with intro paragraph, NOT the H1]`;
}

function getWeatherModeInstructions(mode: WeatherMode): string {
  switch (mode) {
    case "post-event":
      return `POST-EVENT MODE: Significant weather has ALREADY occurred in the past 48 hours.
- Lead with what happened: reference the actual historical weather data (temperatures, storms, freeze events).
- Focus on DAMAGE ASSESSMENT and RECOVERY -- what should homeowners check NOW?
- Use urgency: "If your plants showed stress during yesterday's 105\u00B0F heat, they may need immediate attention."
- Frame Outdoor Renovations as the immediate solution -- "Call today for a landscape assessment."
- Still reference the upcoming forecast if relevant weather continues.
- Post-event content typically converts higher because homeowners are actively searching for help.`;

    case "combined":
      return `COMBINED MODE: Significant weather ALREADY hit AND more is coming.
- Open by acknowledging recent conditions: reference historical weather data.
- Pivot to urgency: "And more extreme weather is on the way this week."
- Structure: (1) What happened -> (2) What to check now -> (3) What's coming -> (4) How to prepare.
- This is the highest-urgency content mode. Homeowners need immediate action AND preparation.
- Frame Outdoor Renovations as the urgent-response partner for landscape recovery and protection.`;

    case "pre-event":
    default:
      return `PRE-EVENT MODE: No significant recent weather, but the forecast shows conditions ahead.
- Focus on PREPARATION and PREVENTION.
- Reference specific forecast data: what's coming and when.
- Guide homeowners on what to inspect, protect, or service BEFORE the weather arrives.
- Frame Outdoor Renovations as the proactive partner -- "Don't wait until the freeze damages your irrigation."
- Seasonal maintenance and planning angles work well in this mode.`;
  }
}

// =============================================================
//  WEATHER USER PROMPT
// =============================================================

function buildWeatherUserPrompt(
  context: WeatherContext,
  targetCity: CityConfig,
  internalLinks: string,
  geoFooterLinks: ServiceAreaLink[]
): string {
  const { mode, historical, forecast } = context;

  const forecastDetails = forecast.periods
    .filter((p) => p.isDaytime)
    .slice(0, 7)
    .map(
      (p) =>
        `${p.name}: ${p.temperature}\u00B0${p.temperatureUnit}, ${p.shortForecast}, Wind ${p.windSpeed} ${p.windDirection}`
    )
    .join("\n");

  const alertsText =
    forecast.alerts.length > 0
      ? forecast.alerts
          .map((a) => `WARNING: ${a.event}: ${a.headline}`)
          .join("\n")
      : "No active weather alerts.";

  const geoFooterText = geoFooterLinks
    .map((link) => `- [${link.label}](${link.url})`)
    .join("\n");

  const externalSourcesText = siteConfig.externalAuthoritySources
    .map((s) => `- ${s.name}: ${s.url} (${s.topic})`)
    .join("\n");

  const historicalSection =
    mode === "pre-event"
      ? ""
      : `
HISTORICAL WEATHER (PAST 48 HOURS):
- Total precipitation: ${historical.totalPrecipitation} inches
- Peak wind gust: ${historical.peakWindGust} mph
- Severe weather occurred: ${historical.hadSevereWeather ? "YES" : "No"}
${historical.severeEvents.length > 0 ? `- Severe events: ${historical.severeEvents.join(", ")}` : ""}
- Summary: ${historical.summary}

WARNING: You MUST reference these historical weather facts in the opening paragraphs. This is real data.
`;

  return `Write a ${mode.toUpperCase()} weather-triggered blog post for the week of ${context.weekLabel}.
TARGET CITY: ${targetCity.name}, ${targetCity.county} County, TX

CONTENT MODE: ${mode}
${historicalSection}
7-DAY FORECAST FOR AUSTIN, TX:
${forecastDetails}

FORECAST SUMMARY:
- Dominant condition: ${forecast.summary.dominantCondition}
- Temperature range: ${forecast.summary.lowTemp}\u00B0F to ${forecast.summary.highTemp}\u00B0F
- Precipitation days: ${forecast.summary.precipitationDays}
- Storm risk: ${forecast.summary.stormRisk}
- Freeze risk: ${forecast.summary.freezeRisk}
- Extreme heat risk: ${forecast.summary.extremeHeatRisk}
- Hail risk: ${forecast.summary.hailRisk}
- High wind risk: ${forecast.summary.highWindRisk}
- Heavy rain risk: ${forecast.summary.heavyRainRisk}
- Ice storm risk: ${forecast.summary.iceStormRisk}

DOMINANT HAZARD: ${context.dominantHazard}

ACTIVE ALERTS:
${alertsText}

WEATHER STORY:
${context.forecastSummary}

PRIMARY SERVICE FOCUS: ${context.affectedServices[0]}
SECONDARY SERVICES: ${context.affectedServices.slice(1).join(", ")}

VERIFIED INTERNAL LINKS (use 4+ of these -- ONLY these URLs):
${internalLinks}

VERIFIED EXTERNAL AUTHORITY SOURCES (use 2+ from this list):
${externalSourcesText}

BUSINESS INFO:
- Name: ${siteConfig.companyName}
- Owner: ${siteConfig.ownerName}, ${siteConfig.ownerTitle}
- Phone: ${siteConfig.phone}
- Address: ${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.stateAbbr} ${siteConfig.address.zip}
- Service area: ${siteConfig.serviceArea}
- Service area cities: ${serviceAreaCities.map((c) => c.name).join(", ")}
- Contact page: ${siteConfig.keyPages.contact}
- ${siteConfig.certifications.join(" | ")}
- ${siteConfig.projectsCompleted} projects completed | ${siteConfig.reviews}

SERVICE AREA GEO-LINK FOOTER -- Include this EXACTLY at the end of the post, before the FAQ section:

### Serving ${targetCity.name} & Central Texas
${geoFooterText}

Generate the blog post now following all SOP rules and the exact output format specified.`;
}

// =============================================================
//  SERVICE SYSTEM PROMPT
// =============================================================

function buildServiceSystemPrompt(
  serviceName: string,
  season: string
): string {
  return `You are a professional SEO content writer for ${siteConfig.companyName}, a licensed landscape contractor in ${siteConfig.serviceArea} since ${siteConfig.foundedYear}. The company is owned by ${siteConfig.ownerName} and has completed ${siteConfig.projectsCompleted} projects with a ${siteConfig.averageRating}-star rating. They are fully bonded and insured with a 1-year service guarantee. Their motto is "${siteConfig.motto}" and tagline is "${siteConfig.tagline}."

You are writing a deep-dive service blog post about "${serviceName}" with a ${season} seasonal tie-in.

KEY CENTRAL TEXAS LANDSCAPING FACTS (use naturally in content):
- Austin summers can exceed ${siteConfig.keyFacts.austinSummersExceed}
- Soil types: ${siteConfig.keyFacts.soilTypes}
- ${siteConfig.keyFacts.waterRestrictions}
- Smart irrigation controllers provide ${siteConfig.keyFacts.smartControllerSavings}
- Quality landscaping delivers ${siteConfig.keyFacts.landscapeROI}
- Average annual rainfall: ${siteConfig.keyFacts.avgAnnualRainfall}
- Growing seasons: ${siteConfig.keyFacts.growingSeasons}
- Native plant options: ${siteConfig.keyFacts.nativePlants}
- Hardscape installation: ${siteConfig.keyFacts.hardscapeSeasons}

STRICT CONTENT RULES (Core Content Creation SOP):
1. Write exactly 1,500-2,200 words of verified, substantive content. No filler.
2. Include the primary keyword (service name + city) in the H1 title and within the first 100 words.
3. Introduce the business entity "${siteConfig.companyName}" in the first paragraph.
4. Include 4 or more internal links to verified service pages (provided below).
5. Include 2 or more external Tier 1 links -- ONLY to .gov, .edu, or established industry authorities.
6. Add "Key Takeaway" callout blocks after every 2-3 H2 sections.
7. Include 6 or more FAQ items at the end, structured for FAQPage schema.
8. Do NOT fabricate statistics, credentials, certifications, or customer stories.
9. Reference Austin, Central Texas, and Hill Country service areas by name.
10. Tie content to the current ${season} season -- what makes this service relevant NOW.
11. Include a CTA paragraph at the end with phone number ${siteConfig.phone}.
12. Write in a professional but approachable tone -- like a knowledgeable neighbor.

CRITICAL -- IMMEDIATE ACTION SUMMARY BOX:
Your FIRST content after the intro paragraph MUST be a summary box block formatted EXACTLY like this:

> **${serviceName} Guide for [City] Homeowners**
> [Write a 75-100 word summary covering what this service includes, why it matters in ${season}, and what homeowners should know. Self-contained, factual, parseable by AI Overview systems.]

OUTPUT FORMAT -- respond with EXACTLY this structure (use the delimiters precisely):

===TITLE===
[SEO-optimized H1 title, 50-70 characters]
===META_TITLE===
[Title tag, 50-60 characters]
===META_DESCRIPTION===
[Meta description, 150-160 characters]
===CATEGORY===
[One of: landscape-design, hardscaping, custom-carpentry, softscaping-planting, irrigation-drainage, landscape-lighting, metal-fabrication, property-management, general]
===TAGS===
[Comma-separated tags]
===FAQ_JSON===
[JSON array of {question, answer} objects -- minimum 6 items]
===CONTENT===
[Full Markdown blog post content starting with intro paragraph, NOT the H1]`;
}

// =============================================================
//  SERVICE USER PROMPT
// =============================================================

function buildServiceUserPrompt(
  service: { name: string; slug: string; shortDescription: string },
  targetCity: CityConfig,
  season: string,
  weatherContext: WeatherContext,
  internalLinks: string,
  geoFooterLinks: ServiceAreaLink[]
): string {
  const geoFooterText = geoFooterLinks
    .map((link) => `- [${link.label}](${link.url})`)
    .join("\n");

  const externalSourcesText = siteConfig.externalAuthoritySources
    .map((s) => `- ${s.name}: ${s.url} (${s.topic})`)
    .join("\n");

  return `Write a deep-dive service blog post about "${service.name}" for homeowners in ${targetCity.name}, ${targetCity.county} County, TX.

SERVICE DETAILS:
- Name: ${service.name}
- Slug: ${service.slug}
- Description: ${service.shortDescription}
- Service page: ${getServicePageUrl(service.slug)}
- Service x Location page: ${getServiceLocationUrl(service.slug, targetCity.slug)}

TARGET CITY CONTEXT:
- City: ${targetCity.name}
- County: ${targetCity.county} County
- Terrain: ${targetCity.county === "Hays" ? "Hill Country limestone terrain, rocky soil, steep grades" : "Mix of Austin clay soils and limestone substrata, mature tree canopy"}

SEASONAL CONTEXT: ${season}
- Current weather: ${weatherContext.forecastSummary}
- Temperature range: ${weatherContext.forecast.summary.lowTemp}\u00B0F to ${weatherContext.forecast.summary.highTemp}\u00B0F

VERIFIED INTERNAL LINKS (use 4+ of these -- ONLY these URLs):
${internalLinks}

VERIFIED EXTERNAL AUTHORITY SOURCES (use 2+ from this list):
${externalSourcesText}

BUSINESS INFO:
- Name: ${siteConfig.companyName}
- Owner: ${siteConfig.ownerName}, ${siteConfig.ownerTitle}
- Phone: ${siteConfig.phone}
- Address: ${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.stateAbbr} ${siteConfig.address.zip}
- Service area: ${siteConfig.serviceArea}
- Service area cities: ${serviceAreaCities.map((c) => c.name).join(", ")}
- Contact page: ${siteConfig.keyPages.contact}
- ${siteConfig.certifications.join(" | ")}
- ${siteConfig.projectsCompleted} projects completed | ${siteConfig.reviews}

SERVICE AREA GEO-LINK FOOTER -- Include this EXACTLY at the end of the post, before the FAQ section:

### ${service.name} in ${targetCity.name} & Central Texas
${geoFooterText}

Generate the blog post now following all SOP rules and the exact output format specified.`;
}

// =============================================================
//  INTERNAL LINKS CONTEXT BUILDER
// =============================================================

/**
 * Build internal links context for the target city.
 * Includes: service pages, location pages, and service x location cross-links.
 */
export function buildInternalLinksContext(targetCity: CityConfig): string {
  const links: string[] = [];

  // Service pages
  for (const service of services) {
    links.push(`- ${service.name}: ${getServicePageUrl(service.slug)}`);
  }

  // Location pages
  for (const city of serviceAreaCities) {
    links.push(
      `- ${city.name} Landscaping Services: ${getLocationPageUrl(city.slug)}`
    );
  }

  // Service x Location cross-links for the target city
  for (const service of services) {
    links.push(
      `- ${service.name} in ${targetCity.name}: ${getServiceLocationUrl(service.slug, targetCity.slug)}`
    );
  }

  // Key pages
  links.push(`- About Us: ${siteConfig.keyPages.about}`);
  links.push(`- Contact Us: ${siteConfig.keyPages.contact}`);
  links.push(`- Portfolio: ${siteConfig.keyPages.portfolio}`);

  return links.join("\n");
}

// =============================================================
//  GEO-ANCHOR FOOTER LINKS
// =============================================================

/**
 * Build geo-footer links: each service x target city combination.
 */
export function buildGeoFooterLinks(
  serviceSlugs: string[],
  targetCity: CityConfig
): ServiceAreaLink[] {
  return serviceSlugs.map((slug) => {
    const serviceConfig = services.find((s) => s.slug === slug);
    const label = serviceConfig
      ? `${serviceConfig.name} in ${targetCity.name}`
      : `Landscaping in ${targetCity.name}`;
    return {
      label,
      url: getServiceLocationUrl(slug, targetCity.slug),
    };
  });
}

// =============================================================
//  RESPONSE PARSER
// =============================================================

interface ParseOptions {
  weatherTriggered: boolean;
  weatherMode: WeatherMode;
  weatherWeek: string;
  geoFooterLinks: ServiceAreaLink[];
  primaryService: string;
}

/**
 * Parse Claude's generated content into a GeneratedBlog.
 */
export function parseGeneratedContent(
  raw: string,
  postType: "weather" | "service",
  targetCityName: string,
  options: ParseOptions
): GeneratedBlog {
  const extract = (tag: string): string => {
    const regex = new RegExp(`===${tag}===\\s*([\\s\\S]*?)(?====\\w|$)`);
    const match = raw.match(regex);
    return (match?.[1] || "").trim();
  };

  const title = extract("TITLE");
  const metaTitle = extract("META_TITLE") || title.substring(0, 60);
  const metaDescription = extract("META_DESCRIPTION");
  const category = extract("CATEGORY") as BlogFrontmatter["category"];
  const tags = extract("TAGS")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let faqItems: { question: string; answer: string }[] = [];
  try {
    const faqRaw = extract("FAQ_JSON");
    faqItems = JSON.parse(faqRaw);
  } catch {
    faqItems = [];
  }

  const content = extract("CONTENT");

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const frontmatter: BlogFrontmatter = {
    title,
    slug,
    publishDate: dateStr,
    author: siteConfig.companyName,
    category:
      category || (options.primaryService as BlogFrontmatter["category"]),
    tags,
    metaTitle: metaTitle.substring(0, 60),
    metaDescription: metaDescription.substring(0, 160),
    weatherTriggered: options.weatherTriggered,
    weatherMode: options.weatherMode,
    weatherWeek: options.weatherWeek,
    featuredImage: getBlogFeaturedImage(
      category || (options.primaryService as string) || "general",
      slug
    ).src,
    featuredImageAlt: getBlogFeaturedImage(
      category || (options.primaryService as string) || "general",
      slug
    ).alt,
    serviceAreaFooterLinks: options.geoFooterLinks.slice(0, 10),
    targetCity: targetCityName,
    postType,
    schema: {
      type: "Article",
      faqItems,
    },
    status: "published",
  };

  const frontmatterYaml = composeFrontmatterYaml(frontmatter);
  const markdownContent = `${frontmatterYaml}\n\n${content}`;

  const fileName = `${dateStr}-${slug}.md`;
  const filePath = `content/posts/${fileName}`;

  return {
    frontmatter,
    markdownContent,
    filePath,
  };
}

function composeFrontmatterYaml(fm: BlogFrontmatter): string {
  const faqYaml = fm.schema.faqItems
    .map(
      (item) =>
        `    - question: "${escapeYaml(item.question)}"\n      answer: "${escapeYaml(item.answer)}"`
    )
    .join("\n");

  const geoLinksYaml = fm.serviceAreaFooterLinks
    .map(
      (link) =>
        `  - label: "${escapeYaml(link.label)}"\n    url: "${link.url}"`
    )
    .join("\n");

  return `---
title: "${escapeYaml(fm.title)}"
slug: "${fm.slug}"
publishDate: "${fm.publishDate}"
author: "${fm.author}"
category: "${fm.category}"
tags: [${fm.tags.map((t) => `"${escapeYaml(t)}"`).join(", ")}]
metaTitle: "${escapeYaml(fm.metaTitle)}"
metaDescription: "${escapeYaml(fm.metaDescription)}"
weatherTriggered: ${fm.weatherTriggered}
weatherMode: "${fm.weatherMode}"
weatherWeek: "${fm.weatherWeek}"
featuredImage: "${fm.featuredImage}"
featuredImageAlt: "${escapeYaml(fm.featuredImageAlt)}"
targetCity: "${fm.targetCity}"
postType: "${fm.postType}"
serviceAreaFooterLinks:
${geoLinksYaml}
schema:
  type: "${fm.schema.type}"
  faqItems:
${faqYaml}
status: "${fm.status}"
---`;
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}
