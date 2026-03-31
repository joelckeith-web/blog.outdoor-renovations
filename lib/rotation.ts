import type { RotationState } from "./types";
import type { ServiceConfig, CityConfig } from "./site-config";
import { services, serviceAreaCities } from "./site-config";
import { getFileFromGitHub, pushFileToGitHub } from "./github";

const ROTATION_FILE = "content/rotation-state.json";

/** Default rotation state -- starts at index 0 for everything */
function defaultRotationState(): RotationState {
  return {
    weatherCityIndex: 0,
    serviceCityIndex: 0,
    serviceIndex: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Read the current rotation state from GitHub.
 * Returns defaults if the file doesn't exist or can't be parsed.
 */
export async function getRotationState(): Promise<RotationState> {
  try {
    const content = await getFileFromGitHub(ROTATION_FILE);
    if (!content) {
      console.log("[ROTATION] No rotation state found, using defaults.");
      return defaultRotationState();
    }
    const parsed = JSON.parse(content) as RotationState;
    // Validate indices are within bounds
    return {
      weatherCityIndex: parsed.weatherCityIndex % serviceAreaCities.length,
      serviceCityIndex: parsed.serviceCityIndex % serviceAreaCities.length,
      serviceIndex: parsed.serviceIndex % services.length,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[ROTATION] Error reading rotation state:", err);
    return defaultRotationState();
  }
}

/**
 * Get the next city for a weather-triggered post.
 * Returns the current city and advances the index.
 */
export function getNextWeatherCity(state: RotationState): {
  city: CityConfig;
  updatedState: RotationState;
} {
  const city = serviceAreaCities[state.weatherCityIndex];
  const nextIndex =
    (state.weatherCityIndex + 1) % serviceAreaCities.length;

  return {
    city,
    updatedState: {
      ...state,
      weatherCityIndex: nextIndex,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Get the next service + city combination for a service-focused post.
 * Rotates through all services for each city, then moves to next city.
 * Total cycle: 8 services x 10 cities = 80 unique combinations.
 */
export function getNextServiceAndCity(state: RotationState): {
  service: ServiceConfig;
  city: CityConfig;
  updatedState: RotationState;
} {
  const service = services[state.serviceIndex];
  const city = serviceAreaCities[state.serviceCityIndex];

  // Advance: next service. If all services done, advance city.
  let nextServiceIndex = (state.serviceIndex + 1) % services.length;
  let nextCityIndex = state.serviceCityIndex;

  if (nextServiceIndex === 0) {
    // Wrapped around services, advance to next city
    nextCityIndex = (state.serviceCityIndex + 1) % serviceAreaCities.length;
  }

  return {
    service,
    city,
    updatedState: {
      ...state,
      serviceIndex: nextServiceIndex,
      serviceCityIndex: nextCityIndex,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Save updated rotation state to GitHub.
 */
export async function saveRotationState(
  state: RotationState
): Promise<void> {
  const content = JSON.stringify(state, null, 2);
  await pushFileToGitHub(
    ROTATION_FILE,
    content,
    `Update rotation state: weather=${state.weatherCityIndex}, service=${state.serviceIndex}, city=${state.serviceCityIndex}`
  );
  console.log("[ROTATION] State saved to GitHub.");
}
