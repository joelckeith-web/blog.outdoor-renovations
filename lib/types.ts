import type { ServiceConfig, CityConfig } from "./site-config";

// ─── Weather mode ──────────────────────────────────────────
/** Weather mode -- derived from historical + forecast analysis */
export type WeatherMode = "pre-event" | "post-event" | "combined";

// ─── Blog frontmatter ──────────────────────────────────────
/** Blog post frontmatter schema */
export interface BlogFrontmatter {
  title: string;
  slug: string;
  publishDate: string; // YYYY-MM-DD
  author: string;
  category:
    | "landscape-design"
    | "hardscaping"
    | "custom-carpentry"
    | "softscaping-planting"
    | "irrigation-drainage"
    | "landscape-lighting"
    | "metal-fabrication"
    | "property-management"
    | "general";
  tags: string[];
  metaTitle: string; // 50-60 chars
  metaDescription: string; // 150-160 chars
  weatherTriggered: boolean;
  weatherMode: WeatherMode;
  weatherWeek: string; // e.g. "March 24-30, 2026"
  featuredImage: string;
  featuredImageAlt: string;
  serviceAreaFooterLinks: ServiceAreaLink[];
  targetCity: string; // city name for geo-targeting
  postType: "weather" | "service"; // generation source
  schema: {
    type: "Article" | "BlogPosting";
    faqItems: FaqItem[];
  };
  useBroadcastEvent: boolean; // A/B test: true = BroadcastEvent schema + Indexing API
  status: "draft" | "published";
}

export interface ServiceAreaLink {
  label: string; // e.g. "Hardscaping in Westlake Hills"
  url: string; // verified service x location URL
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
  slug: string;
  readingTime: string;
}

// ─── NWS Weather API types ─────────────────────────────────
export interface WeatherPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: {
    unitCode: string;
    value: number | null;
  };
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

/** NWS observation from past 48 hours */
export interface WeatherObservation {
  timestamp: string;
  temperature: number | null; // degF
  windSpeed: number | null; // mph
  windGust: number | null; // mph
  precipitationLastHour: number | null; // inches
  description: string;
}

/** Historical weather summary (past 48 hours) */
export interface HistoricalWeather {
  totalPrecipitation: number; // inches
  peakWindGust: number; // mph
  hadSevereWeather: boolean;
  severeEvents: string[];
  summary: string;
}

export interface WeeklyForecast {
  location: string;
  fetchedAt: string;
  weekRange: string;
  periods: WeatherPeriod[];
  alerts: WeatherAlert[];
  summary: WeatherSummary;
}

export interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
  description: string;
  onset: string;
  expires: string;
}

export interface WeatherSummary {
  dominantCondition: string;
  highTemp: number;
  lowTemp: number;
  precipitationDays: number;
  stormRisk: boolean;
  freezeRisk: boolean;
  hailRisk: boolean;
  highWindRisk: boolean;
  heavyRainRisk: boolean;
  dustStormRisk: boolean;
  extremeHeatRisk: boolean;
  iceStormRisk: boolean;
  relevantServices: string[];
  weatherStory: string;
}

/** Full weather context -- combines historical + forecast + mode */
export interface WeatherContext {
  mode: WeatherMode;
  historical: HistoricalWeather;
  forecast: WeeklyForecast;
  historicalSummary: string;
  forecastSummary: string;
  dominantHazard: string;
  affectedServices: string[];
  weekLabel: string;
}

// ─── Content generation types ──────────────────────────────
export interface GeneratedBlog {
  frontmatter: BlogFrontmatter;
  markdownContent: string;
  filePath: string;
}

// ─── Rotation state (city/service round-robin) ─────────────
export interface RotationState {
  weatherCityIndex: number;
  serviceCityIndex: number;
  serviceIndex: number;
  lastUpdated: string; // ISO 8601
}

// ─── Service blog context (for non-weather posts) ──────────
export interface ServiceBlogContext {
  service: ServiceConfig;
  targetCity: CityConfig;
  season: string;
  weatherContext: WeatherContext;
}
