import type {
  WeeklyForecast,
  WeatherPeriod,
  WeatherAlert,
  WeatherSummary,
  WeatherContext,
  WeatherMode,
  HistoricalWeather,
  WeatherObservation,
} from "./types";

/**
 * Austin, TX coordinates for NWS API.
 * Primary point: Austin city center (used for forecast grid).
 */
const PRIMARY_LAT = 30.2672;
const PRIMARY_LON = -97.7431;

/**
 * NWS observation stations across the Austin / Central Texas area.
 * Pulling from multiple stations gives a broader weather picture
 * covering all of Outdoor Renovations' primary service areas.
 */
const AUSTIN_STATIONS = [
  { id: "KAUS", name: "Austin (Bergstrom)" },
  { id: "KATT", name: "Austin (Camp Mabry)" },
  { id: "KEDC", name: "Austin Executive (Dripping Springs area)" },
];

const NWS_USER_AGENT = "OutdoorRenoBlog/1.0 (kstoutenger@gmail.com)";

// --- Unit conversion helpers --------------------------------
function celsiusToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}
function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}
function mmToInches(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}

// --- Severe weather keyword detection (Texas-specific) ------
const SEVERE_KEYWORDS = [
  "severe thunderstorm",
  "flash flood",
  "tornado",
  "hail",
  "high wind warning",
  "damaging wind",
  "ice storm",
  "winter storm",
  "hard freeze",
  "freeze warning",
  "excessive heat",
  "extreme heat",
  "flooding",
  "blowing dust",
];

// =============================================================
//  PUBLIC API
// =============================================================

/**
 * Build full weather context combining:
 * 1. Historical observations (past 48 hours)
 * 2. 7-day forecast
 * 3. Mode classification (pre-event / post-event / combined)
 *
 * This is the single entry point the content generator calls.
 */
export async function buildWeatherContext(): Promise<WeatherContext> {
  const [historical, forecast] = await Promise.all([
    fetchHistoricalObservations(),
    fetchWeeklyForecast(),
  ]);

  const mode = determineWeatherMode(historical, forecast);
  const historicalSummary = buildHistoricalSummary(historical);
  const forecastSummary = forecast.summary.weatherStory;

  const { dominantHazard, affectedServices } = classifyHazards(
    mode,
    historical,
    forecast
  );

  return {
    mode,
    historical,
    forecast,
    historicalSummary,
    forecastSummary,
    dominantHazard,
    affectedServices,
    weekLabel: forecast.weekRange,
  };
}

export { fetchWeeklyForecast };

// =============================================================
//  HISTORICAL OBSERVATIONS (past 48 hours from Austin stations)
// =============================================================

/**
 * Fetch historical observations from ALL Austin-area stations in parallel,
 * then merge into a single HistoricalWeather summary. This captures
 * weather events across Austin, Dripping Springs, and surrounding areas.
 */
async function fetchHistoricalObservations(): Promise<HistoricalWeather> {
  const headers: Record<string, string> = {
    "User-Agent": NWS_USER_AGENT,
    Accept: "application/geo+json",
  };

  // Fetch all stations in parallel
  const stationResults = await Promise.allSettled(
    AUSTIN_STATIONS.map((station) =>
      fetchStationObservations(station.id, station.name, headers)
    )
  );

  // Merge observations from all successful fetches
  const allObservations: WeatherObservation[] = [];
  const stationsReporting: string[] = [];

  for (let i = 0; i < stationResults.length; i++) {
    const result = stationResults[i];
    if (result.status === "fulfilled" && result.value.length > 0) {
      allObservations.push(...result.value);
      stationsReporting.push(AUSTIN_STATIONS[i].name);
    }
  }

  if (allObservations.length === 0) {
    console.warn(
      "No observations from any Austin station. Using empty historical."
    );
    return emptyHistorical();
  }

  console.log(`[WEATHER] Stations reporting: ${stationsReporting.join(", ")}`);

  // Aggregate across all stations -- use worst-case values
  let totalPrecip = 0;
  let peakGust = 0;
  let peakTemp = 0;
  let lowTemp = 999;
  const severeEvents: string[] = [];

  for (const obs of allObservations) {
    if (obs.precipitationLastHour && obs.precipitationLastHour > 0) {
      totalPrecip += obs.precipitationLastHour;
    }
    if (obs.windGust && obs.windGust > peakGust) {
      peakGust = obs.windGust;
    }
    if (obs.temperature !== null && obs.temperature > peakTemp) {
      peakTemp = obs.temperature;
    }
    if (obs.temperature !== null && obs.temperature < lowTemp) {
      lowTemp = obs.temperature;
    }
    const desc = obs.description.toLowerCase();
    for (const kw of SEVERE_KEYWORDS) {
      if (desc.includes(kw) && !severeEvents.includes(kw)) {
        severeEvents.push(kw);
      }
    }
  }

  // Average precip across stations to avoid over-counting
  const stationCount = stationsReporting.length;
  const avgPrecip = stationCount > 0 ? totalPrecip / stationCount : 0;

  // Texas-specific: extreme heat (100degF+) or freeze (32degF-) counts as severe
  const hadSevere =
    severeEvents.length > 0 ||
    peakGust > 50 ||
    avgPrecip > 2 ||
    peakTemp > 105 ||
    lowTemp <= 28;

  return {
    totalPrecipitation: Math.round(avgPrecip * 100) / 100,
    peakWindGust: Math.round(peakGust),
    hadSevereWeather: hadSevere,
    severeEvents,
    summary: buildHistoricalSummaryText(
      avgPrecip,
      peakGust,
      peakTemp,
      lowTemp,
      hadSevere,
      severeEvents,
      allObservations
    ),
  };
}

/**
 * Fetch observations from a single NWS station.
 */
async function fetchStationObservations(
  stationId: string,
  stationName: string,
  headers: Record<string, string>
): Promise<WeatherObservation[]> {
  try {
    const res = await fetch(
      `https://api.weather.gov/stations/${stationId}/observations?limit=96`,
      { headers }
    );

    if (!res.ok) {
      console.warn(`NWS station ${stationId} (${stationName}): ${res.status}`);
      return [];
    }

    const data = await res.json();
    const features: Array<{ properties: Record<string, unknown> }> =
      data.features || [];

    return features
      .map((f) => {
        const p = f.properties;
        return {
          timestamp: (p.timestamp as string) || "",
          temperature: extractTemp(p),
          windSpeed: extractWindSpeed(p),
          windGust: extractWindGust(p),
          precipitationLastHour: extractPrecip(p),
          description: (p.textDescription as string) || "",
        };
      })
      .filter((o) => o.timestamp);
  } catch (err) {
    console.warn(`Failed to fetch ${stationId} (${stationName}):`, err);
    return [];
  }
}

function emptyHistorical(): HistoricalWeather {
  return {
    totalPrecipitation: 0,
    peakWindGust: 0,
    hadSevereWeather: false,
    severeEvents: [],
    summary:
      "No significant weather events in the past 48 hours across the Austin Metro area (Austin, Hill Country, Central Texas).",
  };
}

// --- NWS observation field extractors -----------------------

function extractTemp(p: Record<string, unknown>): number | null {
  const t = p.temperature as { value: number | null } | null;
  if (!t || t.value === null) return null;
  return celsiusToF(t.value);
}

function extractWindSpeed(p: Record<string, unknown>): number | null {
  const w = p.windSpeed as { value: number | null } | null;
  if (!w || w.value === null) return null;
  return kphToMph(w.value);
}

function extractWindGust(p: Record<string, unknown>): number | null {
  const g = p.windGust as { value: number | null } | null;
  if (!g || g.value === null) return null;
  return kphToMph(g.value);
}

function extractPrecip(p: Record<string, unknown>): number | null {
  const pr = p.precipitationLastHour as { value: number | null } | null;
  if (!pr || pr.value === null) return null;
  return mmToInches(pr.value);
}

function buildHistoricalSummaryText(
  precip: number,
  gust: number,
  peakTemp: number,
  lowTemp: number,
  severe: boolean,
  events: string[],
  observations: WeatherObservation[]
): string {
  const parts: string[] = [];

  if (severe && events.length > 0) {
    parts.push(
      `Significant weather hit the Austin Metro area in the past 48 hours: ${events.join(", ")}.`
    );
  }

  if (peakTemp > 105) {
    parts.push(
      `Temperatures reached ${peakTemp}\u00B0F \u2014 extreme heat conditions impacting landscapes.`
    );
  }

  if (lowTemp <= 32) {
    parts.push(
      `Temperatures dropped to ${lowTemp}\u00B0F \u2014 freeze conditions threatening plants and irrigation.`
    );
  }

  if (precip > 0.5) {
    parts.push(`${precip.toFixed(2)} inches of precipitation recorded.`);
  }

  if (gust > 35) {
    parts.push(`Wind gusts peaked at ${gust} mph.`);
  }

  if (parts.length === 0) {
    const recentDescs = observations
      .slice(0, 6)
      .map((o) => o.description)
      .filter(Boolean);
    const unique = [...new Set(recentDescs)];
    parts.push(
      `Recent conditions across the Austin Metro area: ${unique.join(", ") || "clear skies"}.`
    );
  }

  return parts.join(" ");
}

// =============================================================
//  MODE CLASSIFICATION
// =============================================================

function determineWeatherMode(
  historical: HistoricalWeather,
  forecast: WeeklyForecast
): WeatherMode {
  const pastSignificant =
    historical.totalPrecipitation > 0.5 ||
    historical.peakWindGust > 35 ||
    historical.hadSevereWeather;

  const forecastSignificant =
    forecast.summary.stormRisk ||
    forecast.summary.hailRisk ||
    forecast.summary.highWindRisk ||
    forecast.summary.heavyRainRisk ||
    forecast.summary.extremeHeatRisk ||
    forecast.summary.freezeRisk ||
    forecast.summary.iceStormRisk;

  if (pastSignificant && forecastSignificant) return "combined";
  if (pastSignificant) return "post-event";
  return "pre-event";
}

// =============================================================
//  HAZARD CLASSIFICATION (Central Texas landscaping-specific)
// =============================================================

function classifyHazards(
  mode: WeatherMode,
  historical: HistoricalWeather,
  forecast: WeeklyForecast
): { dominantHazard: string; affectedServices: string[] } {
  if (mode === "post-event") {
    if (historical.severeEvents.length > 0) {
      const event = historical.severeEvents[0];
      if (event.includes("ice") || event.includes("winter storm"))
        return {
          dominantHazard: "ice_storm",
          affectedServices: [
            "custom-carpentry",
            "softscaping-planting",
            "property-management",
          ],
        };
      if (event.includes("freeze") || event.includes("hard freeze"))
        return {
          dominantHazard: "freeze",
          affectedServices: [
            "softscaping-planting",
            "irrigation-drainage",
            "property-management",
          ],
        };
      if (event.includes("heat") || event.includes("extreme"))
        return {
          dominantHazard: "extreme_heat",
          affectedServices: [
            "irrigation-drainage",
            "softscaping-planting",
            "property-management",
          ],
        };
      if (event.includes("flood") || event.includes("flash flood"))
        return {
          dominantHazard: "flood_damage",
          affectedServices: [
            "irrigation-drainage",
            "hardscaping",
            "property-management",
          ],
        };
      if (event.includes("tornado") || event.includes("wind"))
        return {
          dominantHazard: "wind_damage",
          affectedServices: [
            "custom-carpentry",
            "metal-fabrication",
            "property-management",
          ],
        };
      if (event.includes("hail"))
        return {
          dominantHazard: "hail_damage",
          affectedServices: [
            "softscaping-planting",
            "custom-carpentry",
            "property-management",
          ],
        };
    }
    if (historical.peakWindGust > 50)
      return {
        dominantHazard: "wind_damage",
        affectedServices: [
          "custom-carpentry",
          "metal-fabrication",
          "property-management",
        ],
      };
    if (historical.totalPrecipitation > 2)
      return {
        dominantHazard: "flood_damage",
        affectedServices: [
          "irrigation-drainage",
          "hardscaping",
          "property-management",
        ],
      };
    return {
      dominantHazard: "storm_damage",
      affectedServices: [
        "property-management",
        "irrigation-drainage",
        "custom-carpentry",
      ],
    };
  }

  return {
    dominantHazard: forecast.summary.dominantCondition,
    affectedServices: forecast.summary.relevantServices,
  };
}

// =============================================================
//  HELPER: human-readable historical summary
// =============================================================

function buildHistoricalSummary(historical: HistoricalWeather): string {
  if (
    historical.totalPrecipitation === 0 &&
    historical.peakWindGust === 0 &&
    !historical.hadSevereWeather
  ) {
    return "No significant weather events have occurred across the Austin Metro area over the past 48 hours.";
  }
  return historical.summary;
}

// =============================================================
//  7-DAY FORECAST
// =============================================================

async function fetchWeeklyForecast(): Promise<WeeklyForecast> {
  const headers = {
    "User-Agent": NWS_USER_AGENT,
    Accept: "application/geo+json",
  };

  const pointsRes = await fetch(
    `https://api.weather.gov/points/${PRIMARY_LAT},${PRIMARY_LON}`,
    { headers }
  );

  if (!pointsRes.ok) {
    throw new Error(
      `NWS Points API error: ${pointsRes.status} ${pointsRes.statusText}`
    );
  }

  const pointsData = await pointsRes.json();
  const forecastUrl: string = pointsData.properties.forecast;
  const alertsZone: string = pointsData.properties.forecastZone;
  const zoneId = alertsZone.split("/").pop();

  const forecastRes = await fetch(forecastUrl, { headers });

  if (!forecastRes.ok) {
    throw new Error(
      `NWS Forecast API error: ${forecastRes.status} ${forecastRes.statusText}`
    );
  }

  const forecastData = await forecastRes.json();
  const periods: WeatherPeriod[] = forecastData.properties.periods;

  const alerts = await fetchAlerts(zoneId!, headers);

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 6);
  const weekRange = `${formatDateShort(now)}\u2013${formatDateShort(endOfWeek)}, ${now.getFullYear()}`;

  const summary = analyzeWeather(periods, alerts);

  return {
    location: "Austin, Central Texas & Hill Country, TX",
    fetchedAt: now.toISOString(),
    weekRange,
    periods,
    alerts,
    summary,
  };
}

async function fetchAlerts(
  zoneId: string,
  headers: Record<string, string>
): Promise<WeatherAlert[]> {
  try {
    const alertsRes = await fetch(
      `https://api.weather.gov/alerts/active?zone=${zoneId}`,
      { headers }
    );

    if (!alertsRes.ok) return [];

    const alertsData = await alertsRes.json();
    return (alertsData.features || []).map(
      (f: { properties: Record<string, string> }) => ({
        event: f.properties.event,
        headline: f.properties.headline,
        severity: f.properties.severity,
        description: (f.properties.description || "").substring(0, 500),
        onset: f.properties.onset,
        expires: f.properties.expires,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Analyze forecast periods -- Central Texas landscaping-specific hazard mapping.
 */
function analyzeWeather(
  periods: WeatherPeriod[],
  alerts: WeatherAlert[]
): WeatherSummary {
  const daytimePeriods = periods.filter((p) => p.isDaytime);
  const allTemps = periods.map((p) => p.temperature);
  const highTemp = Math.max(...allTemps);
  const lowTemp = Math.min(...allTemps);

  const precipDays = daytimePeriods.filter((p) => {
    const forecast = p.shortForecast.toLowerCase();
    return (
      forecast.includes("rain") ||
      forecast.includes("storm") ||
      forecast.includes("shower") ||
      (p.probabilityOfPrecipitation?.value ?? 0) > 30
    );
  }).length;

  const allForecasts = periods
    .map((p) => p.detailedForecast.toLowerCase())
    .join(" ");

  const stormRisk =
    allForecasts.includes("thunderstorm") ||
    allForecasts.includes("severe") ||
    alerts.some((a) => a.event.toLowerCase().includes("thunderstorm"));

  const hailRisk =
    allForecasts.includes("hail") ||
    alerts.some((a) => a.event.toLowerCase().includes("hail"));

  const highWindRisk =
    allForecasts.includes("high wind") ||
    allForecasts.includes("wind advisory") ||
    periods.some((p) => {
      const speed = parseInt(p.windSpeed);
      return speed > 30;
    });

  const freezeRisk =
    lowTemp <= 32 ||
    allForecasts.includes("freeze") ||
    allForecasts.includes("frost");

  const heavyRainRisk =
    allForecasts.includes("heavy rain") ||
    allForecasts.includes("flood") ||
    precipDays >= 3;

  // Texas-specific risks
  const iceStormRisk =
    allForecasts.includes("ice storm") ||
    allForecasts.includes("winter storm") ||
    allForecasts.includes("freezing rain") ||
    allForecasts.includes("sleet") ||
    alerts.some(
      (a) =>
        a.event.toLowerCase().includes("ice") ||
        a.event.toLowerCase().includes("winter storm")
    );

  const dustStormRisk =
    allForecasts.includes("dust") ||
    allForecasts.includes("blowing sand") ||
    alerts.some((a) => a.event.toLowerCase().includes("dust"));

  const extremeHeatRisk =
    highTemp >= 100 ||
    allForecasts.includes("excessive heat") ||
    alerts.some((a) => a.event.toLowerCase().includes("heat"));

  let dominantCondition: string;
  let relevantServices: string[];

  if (iceStormRisk) {
    dominantCondition = "ice_storm";
    relevantServices = [
      "custom-carpentry",
      "softscaping-planting",
      "property-management",
    ];
  } else if (extremeHeatRisk) {
    dominantCondition = "extreme_heat";
    relevantServices = [
      "irrigation-drainage",
      "softscaping-planting",
      "property-management",
    ];
  } else if (stormRisk || hailRisk) {
    dominantCondition = stormRisk ? "severe_storm" : "hail";
    relevantServices = [
      "irrigation-drainage",
      "custom-carpentry",
      "property-management",
    ];
  } else if (highWindRisk) {
    dominantCondition = "high_wind";
    relevantServices = [
      "custom-carpentry",
      "metal-fabrication",
      "property-management",
    ];
  } else if (freezeRisk) {
    dominantCondition = "freeze";
    relevantServices = [
      "softscaping-planting",
      "irrigation-drainage",
      "property-management",
    ];
  } else if (heavyRainRisk) {
    dominantCondition = "heavy_rain";
    relevantServices = [
      "irrigation-drainage",
      "hardscaping",
      "property-management",
    ];
  } else if (highTemp >= 95) {
    dominantCondition = "heat";
    relevantServices = [
      "irrigation-drainage",
      "landscape-lighting",
      "property-management",
    ];
  } else {
    dominantCondition = "mild";
    relevantServices = [
      "landscape-design",
      "hardscaping",
      "landscape-lighting",
    ];
  }

  const weatherStory = buildWeatherStory(
    dominantCondition,
    highTemp,
    lowTemp,
    precipDays
  );

  return {
    dominantCondition,
    highTemp,
    lowTemp,
    precipitationDays: precipDays,
    stormRisk,
    freezeRisk,
    hailRisk,
    highWindRisk,
    heavyRainRisk,
    dustStormRisk,
    extremeHeatRisk,
    iceStormRisk,
    relevantServices,
    weatherStory,
  };
}

function buildWeatherStory(
  condition: string,
  high: number,
  low: number,
  precipDays: number
): string {
  const storyMap: Record<string, string> = {
    extreme_heat: `Extreme heat is expected in the Austin Metro area this week with highs near ${high}\u00B0F. Landscapes will be under maximum stress \u2014 irrigation systems need to be running efficiently, plants need supplemental watering, and new installations should be paused. Homeowners should check smart controllers and ensure drip zones are functioning to protect landscape investments.`,
    heat: `Hot weather continues in Central Texas this week with highs reaching ${high}\u00B0F. Lawns, gardens, and plantings will need careful watering management under Austin Water\u2019s conservation rules. This is a good time to evaluate irrigation efficiency and schedule evening landscape lighting for summer entertaining.`,
    ice_storm: `Ice storm conditions are possible in the Austin area this week with lows near ${low}\u00B0F. Ice accumulation can devastate trees, damage pergolas, fences, and outdoor structures, and rupture irrigation lines. Homeowners should protect vulnerable tropical plants and prepare for potential cleanup.`,
    freeze: `Freezing temperatures are expected in Central Texas with lows near ${low}\u00B0F. Tropical and subtropical plants are at risk. Irrigation systems should be winterized or set to freeze-guard mode. Outdoor plumbing and exposed irrigation lines need insulation to prevent costly damage.`,
    severe_storm: `Severe thunderstorms are expected in the Austin area this week with ${precipDays} days of precipitation forecast. Temperatures from ${low}\u00B0F to ${high}\u00B0F. Heavy rain can cause erosion, overwhelm drainage systems, and damage outdoor structures. Flash flooding is a concern in Hill Country properties with steep grades.`,
    hail: `Hail is in the forecast for Central Texas this week. With temperatures between ${low}\u00B0F and ${high}\u00B0F, hail can shred plant material, damage wood and metal structures, and crack hardscape surfaces. Newly planted landscapes are especially vulnerable.`,
    high_wind: `High winds are expected in the Austin area this week with temperatures from ${low}\u00B0F to ${high}\u00B0F. Wind can topple fences, damage pergolas and shade structures, uproot young trees, and scatter landscape materials. Secure any loose outdoor items and inspect structural connections.`,
    heavy_rain: `Heavy rain is expected in Central Texas this week with ${precipDays} days of precipitation. Temperatures range from ${low}\u00B0F to ${high}\u00B0F. Drainage systems will be tested, and standing water can damage root systems and hardscape foundations. This is an ideal time to evaluate drainage improvements.`,
    mild: `Pleasant weather is expected in the Austin area this week with temperatures from ${low}\u00B0F to ${high}\u00B0F. This is the ideal time to plan landscape renovations, install hardscaping, design outdoor lighting, or schedule a consultation. Mild conditions mean faster plant establishment and better working conditions for construction.`,
  };

  return storyMap[condition] || storyMap.mild;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}
