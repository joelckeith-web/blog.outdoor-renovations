// ─── Service configuration type ────────────────────────────
export interface ServiceConfig {
  name: string;
  slug: string;
  shortDescription: string;
  icon: string;
}

// ─── City configuration type ───────────────────────────────
export interface CityConfig {
  name: string;
  slug: string;
  county: string;
}

export const siteConfig = {
  // Company Information
  companyName: "Outdoor Renovations",
  legalName: "Outdoor Renovations",
  shortName: "Outdoor Reno",
  tagline: "Design | Landscape | Maintain",
  motto: "Renovating Outdoor Dreams to Reality",
  description:
    "Licensed landscape contractor serving Austin Metro & Central Texas since 2010. 200+ completed projects with a 5-star rating. Custom landscape design, hardscaping, carpentry, irrigation, lighting, and property management for residential and commercial clients.",
  reviews: "200+ 5-Star Reviews",
  averageRating: "5.0",

  // Key landscaping facts for content generation
  keyFacts: {
    austinSummersExceed: "105\u00B0F",
    soilTypes:
      "alkaline limestone/caliche in Hill Country, expansive black clay (Houston Black series) in eastern areas",
    waterRestrictions:
      "Austin Water enforces Stage 1\u20134 mandatory water restrictions year-round",
    smartControllerSavings: "30\u201350% water reduction with smart controllers",
    landscapeROI: "100\u2013200% return on investment for quality landscaping",
    avgAnnualRainfall: "~34 inches",
    coolingSeasonLength: "May through September (5+ months of 90\u00B0F+ days)",
    growingSeasons:
      "Two primary planting windows: March\u2013May (spring) and September\u2013November (fall)",
    nativePlants:
      "Texas sage, flame acanthus, Lindheimer muhly, Mexican feathergrass, cedar elm, live oak",
    hardscapeSeasons:
      "Year-round installation possible; avoid pouring concrete above 95\u00B0F",
  },

  foundedYear: 2010,
  ownerName: "Kyle Stoutenger",
  ownerTitle: "Owner & Licensed Landscape Contractor",
  projectsCompleted: "200+",
  certifications: [
    "Licensed Landscape Contractor",
    "Fully Bonded & Insured",
    "1-Year Service Guarantee",
  ],
  email: "kstoutenger@gmail.com",

  // Contact
  phone: "(512) 743-0570",
  phoneRaw: "+15127430570",
  address: {
    street: "1108 Hollybluff St",
    city: "Kyle",
    state: "Texas",
    stateAbbr: "TX",
    zip: "78640",
    country: "US",
  },

  // Credentials
  license: "Licensed Landscape Contractor — State of Texas",

  // Founder / Owner (for schema)
  founder: {
    name: "Kyle Stoutenger",
    jobTitle: "Owner & Licensed Landscape Contractor",
  },

  // Opening hours (for schema)
  openingHoursSpecification: [
    {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    {
      dayOfWeek: "Saturday",
      opens: "08:00",
      closes: "14:00",
    },
  ],

  // Key Pages (for components that link to the main site)
  keyPages: {
    home: "https://outdoorreno.com",
    about: "https://outdoorreno.com/about",
    contact: "https://outdoorreno.com/contact",
    services: "https://outdoorreno.com/services",
    pricing: "https://outdoorreno.com/services-pricing",
    locations: "https://outdoorreno.com/locations",
    portfolio: "https://outdoorreno.com/about",
    blog: "https://blog.outdoorreno.com",
  },

  // Hours
  businessHours: "Mon\u2013Fri 7AM\u20136PM | Sat by appointment",

  // URLs
  mainSiteUrl: "https://outdoorreno.com",
  blogUrl: "https://blog.outdoorreno.com",

  // Social / Entity Bridge sameAs
  sameAs: [
    "https://facebook.com/outdoorrenovations",
    "https://instagram.com/outdoorrenoatx",
    "https://maps.app.goo.gl/iaKdsy6sb7z5yGhw7",
  ],

  social: {
    facebook: "https://facebook.com/outdoorrenovations",
    instagram: "https://instagram.com/outdoorrenoatx",
    google: "https://maps.app.goo.gl/iaKdsy6sb7z5yGhw7",
  },

  // Brand Colors
  colors: {
    primary: "#2D5016", // forest green
    accent: "#4A7C28", // leaf green
    secondary: "#8B6914", // warm gold
    dark: "#1a1a1a",
    light: "#f5f5f5",
    text: "#333333",
  },

  // Primary Service Area
  primaryCity: "Austin",
  primaryState: "TX",
  serviceArea: "Austin Metro & Central Texas",

  // Blog categories
  blogCategories: [
    "landscape-design",
    "hardscaping",
    "custom-carpentry",
    "softscaping-planting",
    "irrigation-drainage",
    "landscape-lighting",
    "metal-fabrication",
    "property-management",
    "general",
  ] as const,

  // External authority sources for blog content
  externalAuthoritySources: [
    {
      name: "Texas A&M AgriLife Extension",
      url: "https://agrilifeextension.tamu.edu",
      topic: "Texas-specific horticulture, soil science, water conservation",
    },
    {
      name: "Lady Bird Johnson Wildflower Center",
      url: "https://www.wildflower.org",
      topic: "Native plants, sustainable landscaping, Central Texas ecology",
    },
    {
      name: "EPA WaterSense",
      url: "https://www.epa.gov/watersense",
      topic: "Water-efficient irrigation, smart controllers, conservation",
    },
    {
      name: "Austin Water Conservation",
      url: "https://www.austintexas.gov/department/water-conservation",
      topic: "Local water restrictions, rebate programs, irrigation rules",
    },
    {
      name: "NOAA / National Weather Service",
      url: "https://www.weather.gov",
      topic: "Weather data, climate patterns, severe weather advisories",
    },
    {
      name: "National Association of Landscape Professionals (NALP)",
      url: "https://www.landscapeprofessionals.org",
      topic: "Industry standards, landscape ROI data, best practices",
    },
  ],

  // Weather-to-Service Mapping (landscaping-specific)
  weatherServiceMap: {
    extremeHeat: {
      threshold: 100,
      services: ["irrigation-drainage", "softscaping-planting", "property-management"],
      urgency: "high" as const,
      topics: [
        "protecting landscape investments during triple-digit heat",
        "emergency irrigation adjustments for Austin heat waves",
        "drought stress signs in Texas plants and trees",
        "smart controller programming for extreme heat conservation",
        "heat-tolerant plant selections for Central Texas",
      ],
    },
    heat: {
      threshold: 95,
      services: ["irrigation-drainage", "landscape-lighting", "property-management"],
      urgency: "medium" as const,
      topics: [
        "summer lawn care tips for Austin homeowners",
        "watering schedules under Austin Water restrictions",
        "outdoor lighting for summer entertaining",
        "heat-resistant hardscape materials for Texas",
        "summer property maintenance checklist",
      ],
    },
    coldSnap: {
      threshold: 32,
      services: ["softscaping-planting", "irrigation-drainage", "property-management"],
      urgency: "high" as const,
      topics: [
        "protecting tropical and subtropical plants from Texas freeze",
        "winterizing irrigation systems in Central Texas",
        "freeze damage assessment and landscape recovery",
        "emergency plant protection for Austin homeowners",
        "post-freeze pruning guide for Texas landscapes",
      ],
    },
    cool: {
      threshold: 50,
      services: ["landscape-design", "hardscaping", "softscaping-planting"],
      urgency: "low" as const,
      topics: [
        "fall planting guide for Central Texas",
        "cool-season landscape renovation planning",
        "hardscape installation during ideal weather",
        "winter garden prep for Austin properties",
        "dormant-season tree and shrub planting",
      ],
    },
    storm: {
      condition: "thunderstorm",
      services: ["irrigation-drainage", "custom-carpentry", "property-management"],
      urgency: "high" as const,
      topics: [
        "drainage solutions after Central Texas storms",
        "storm damage assessment for outdoor structures",
        "flood-prone yard solutions for Hill Country properties",
        "post-storm landscape cleanup and recovery",
        "erosion control after heavy Texas rain",
      ],
    },
    wind: {
      condition: "wind",
      threshold: 30,
      services: ["custom-carpentry", "metal-fabrication", "property-management"],
      urgency: "medium" as const,
      topics: [
        "wind damage to pergolas, fences, and outdoor structures",
        "wind-resistant landscape design for Central Texas",
        "repairing fence and gate damage after high winds",
        "tree damage assessment and removal after storms",
      ],
    },
    rain: {
      condition: "rain",
      services: ["irrigation-drainage", "hardscaping", "softscaping-planting"],
      urgency: "low" as const,
      topics: [
        "drainage improvements for Austin properties",
        "rain garden installation for Central Texas",
        "permeable paver options for wet-weather management",
        "adjusting irrigation after rainfall",
      ],
    },
    mild: {
      condition: "clear",
      services: ["landscape-design", "hardscaping", "landscape-lighting"],
      urgency: "low" as const,
      topics: [
        "best time to start a landscape renovation in Austin",
        "spring hardscape project planning",
        "outdoor lighting design for curb appeal",
        "landscape design consultation \u2014 what to expect",
        "property value boost through professional landscaping",
      ],
    },
    iceStorm: {
      condition: "ice",
      services: ["custom-carpentry", "softscaping-planting", "property-management"],
      urgency: "high" as const,
      topics: [
        "ice storm damage to trees and structures",
        "protecting outdoor wood structures from ice",
        "post-ice landscape recovery for Austin properties",
        "emergency tree limb removal after ice accumulation",
      ],
    },
  },
} as const;

// ─── Blog Featured Image Map ─────────────────────────────────
// Maps service categories to verified OR project images with descriptive alt text.
// Images live on the main site domain. Each category has a primary + fallback.
export const blogImageMap: Record<
  string,
  { src: string; alt: string }[]
> = {
  "landscape-design": [
    { src: "/images/project-landscape.jpg", alt: "Professional landscape design project by Outdoor Renovations in Austin, Texas" },
    { src: "/images/rendering-irle-6.jpg", alt: "3D landscape design rendering for an Austin residential property" },
    { src: "/images/project-design-render.jpg", alt: "Landscape design concept rendering by Outdoor Renovations" },
    { src: "/images/rendering-anstrom-2.jpg", alt: "Evening landscape design rendering with outdoor lighting" },
  ],
  hardscaping: [
    { src: "/images/project-hardscape.jpg", alt: "Premium hardscaping project with natural stone in Austin, TX" },
    { src: "/images/project-stonework.jpg", alt: "Custom stonework and patio installation by Outdoor Renovations" },
    { src: "/images/project-walkway.jpg", alt: "Professional stone walkway installation in Central Texas" },
    { src: "/images/project-corten-steps.jpg", alt: "Modern corten steel steps and hardscape design" },
  ],
  "custom-carpentry": [
    { src: "/images/project-deck.jpg", alt: "Custom deck and pergola construction by Outdoor Renovations in Austin" },
    { src: "/images/install-carpentry-hero.jpg", alt: "Professional outdoor carpentry installation in Central Texas" },
    { src: "/images/install-pergola-detail.jpg", alt: "Custom pergola detail craftsmanship by Outdoor Renovations" },
    { src: "/images/install-carpentry-crew.jpg", alt: "Outdoor Renovations carpentry crew building a custom structure" },
  ],
  "softscaping-planting": [
    { src: "/images/project-planting.jpg", alt: "Expert softscaping and planting installation in Austin, Texas" },
    { src: "/images/project-garden.jpg", alt: "Professionally designed garden with native Texas plantings" },
    { src: "/images/maintain-garden.jpg", alt: "Lush garden landscape maintained by Outdoor Renovations" },
  ],
  "irrigation-drainage": [
    { src: "/images/project-garden.jpg", alt: "Healthy irrigated landscape in Central Texas by Outdoor Renovations" },
    { src: "/images/project-planting.jpg", alt: "Well-irrigated planting beds in an Austin residential landscape" },
  ],
  "landscape-lighting": [
    { src: "/images/project-evening.jpg", alt: "Professional landscape lighting illuminating an Austin property at dusk" },
    { src: "/images/install-landscape-lighting.jpg", alt: "Landscape lighting installation by Outdoor Renovations" },
    { src: "/images/rendering-anstrom-2.jpg", alt: "Evening outdoor lighting design rendering" },
  ],
  "metal-fabrication": [
    { src: "/images/project-corten-steps.jpg", alt: "Custom corten steel metalwork by Outdoor Renovations in Austin" },
    { src: "/images/project-walkway.jpg", alt: "Metal and stone landscape features by Outdoor Renovations" },
  ],
  "property-management": [
    { src: "/images/project-property-care.jpg", alt: "Professional property maintenance service in Austin, Texas" },
    { src: "/images/maintain-garden.jpg", alt: "Ongoing landscape maintenance by Outdoor Renovations" },
    { src: "/images/project-outdoor-living.jpg", alt: "Well-maintained outdoor living space in Central Texas" },
  ],
  general: [
    { src: "/images/hero-drone-estate.jpg", alt: "Aerial view of a premium landscape renovation by Outdoor Renovations in Austin" },
    { src: "/images/project-estate-1.jpg", alt: "Complete estate landscape by Outdoor Renovations in the Austin metro" },
    { src: "/images/hero-estate-landscape.jpg", alt: "Premium residential landscape in Central Texas" },
    { src: "/images/project-feature.jpg", alt: "Featured outdoor renovation project in Austin, Texas" },
  ],
};

/**
 * Get a featured image for a blog post based on its category.
 * Uses a deterministic rotation based on the slug to vary images within a category.
 */
export function getBlogFeaturedImage(
  category: string,
  slug: string
): { src: string; alt: string } {
  const images = blogImageMap[category] || blogImageMap.general;
  // Simple hash from slug to pick a consistent image
  const hash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

// ─── Services (with full descriptions for content generation) ──
export const services: ServiceConfig[] = [
  {
    name: "Landscape Design",
    slug: "landscape-design",
    shortDescription:
      "Custom to-scale 2D plans, 3D renderings, and full design documentation \u2014 from concept to construction-ready drawings.",
    icon: "PenTool",
  },
  {
    name: "Hardscaping",
    slug: "hardscaping",
    shortDescription:
      "Patios, walkways, retaining walls, outdoor kitchens, fire pits, and stone features built with precision and premium materials.",
    icon: "Layers",
  },
  {
    name: "Custom Carpentry",
    slug: "custom-carpentry",
    shortDescription:
      "Pergolas, casitas, decks, fences, gates, and privacy screens \u2014 handcrafted structures that define your outdoor space.",
    icon: "Hammer",
  },
  {
    name: "Softscaping & Planting",
    slug: "softscaping-planting",
    shortDescription:
      "Expert plant selection, installation, and ongoing enhancements tailored to Central Texas climate and your property\u2019s unique conditions.",
    icon: "Leaf",
  },
  {
    name: "Irrigation & Drainage",
    slug: "irrigation-drainage",
    shortDescription:
      "Smart irrigation systems and drainage solutions designed to protect your investment and sustain healthy landscapes year-round.",
    icon: "Droplets",
  },
  {
    name: "Landscape Lighting",
    slug: "landscape-lighting",
    shortDescription:
      "Professional outdoor lighting design and installation that enhances curb appeal, safety, and the ambiance of your property after dark.",
    icon: "Lightbulb",
  },
  {
    name: "Metal Fabrication",
    slug: "metal-fabrication",
    shortDescription:
      "Custom iron and metal work \u2014 fences, gates, retaining walls, edging, pergolas, and architectural features fabricated to your specifications.",
    icon: "Cog",
  },
  {
    name: "Property & Pest Management",
    slug: "property-management",
    shortDescription:
      "White-glove property care from weekly lawn maintenance to all-inclusive outdoor concierge service \u2014 protecting your landscape investment year-round.",
    icon: "TreeDeciduous",
  },
];

// ─── Service Area Cities ───────────────────────────────────
export const serviceAreaCities: CityConfig[] = [
  { name: "Westlake Hills", slug: "westlake-hills", county: "Travis" },
  { name: "Lakeway", slug: "lakeway", county: "Travis" },
  { name: "Bee Cave", slug: "bee-cave", county: "Travis" },
  { name: "Dripping Springs", slug: "dripping-springs", county: "Hays" },
  { name: "Tarrytown", slug: "tarrytown", county: "Travis" },
  { name: "Barton Creek", slug: "barton-creek", county: "Travis" },
  { name: "Rollingwood", slug: "rollingwood", county: "Travis" },
  { name: "Steiner Ranch", slug: "steiner-ranch", county: "Travis" },
  { name: "Circle C Ranch", slug: "circle-c-ranch", county: "Travis" },
  { name: "Travis Heights", slug: "travis-heights", county: "Travis" },
];

// ─── Internal Link Builders ────────────────────────────────

/** Service page URL: https://outdoorreno.com/services/{slug} */
export function getServicePageUrl(serviceSlug: string): string {
  return `${siteConfig.mainSiteUrl}/services/${serviceSlug}`;
}

/** Location page URL: https://outdoorreno.com/locations/{city-slug} */
export function getLocationPageUrl(citySlug: string): string {
  return `${siteConfig.mainSiteUrl}/locations/${citySlug}`;
}

/** Service x Location page URL: https://outdoorreno.com/services/{service-slug}/{city-slug} */
export function getServiceLocationUrl(
  serviceSlug: string,
  citySlug: string
): string {
  return `${siteConfig.mainSiteUrl}/services/${serviceSlug}/${citySlug}`;
}

/**
 * Build full internal links map for all services, locations, and cross-links.
 * Returns 8 service + 10 location + 80 cross-link = 98 total URLs.
 */
export function buildAllInternalLinks(): {
  serviceLinks: { name: string; slug: string; url: string }[];
  locationLinks: { name: string; slug: string; url: string }[];
  crossLinks: {
    serviceName: string;
    cityName: string;
    serviceSlug: string;
    citySlug: string;
    url: string;
  }[];
} {
  const serviceLinks = services.map((s) => ({
    name: s.name,
    slug: s.slug,
    url: getServicePageUrl(s.slug),
  }));

  const locationLinks = serviceAreaCities.map((c) => ({
    name: c.name,
    slug: c.slug,
    url: getLocationPageUrl(c.slug),
  }));

  const crossLinks: {
    serviceName: string;
    cityName: string;
    serviceSlug: string;
    citySlug: string;
    url: string;
  }[] = [];

  for (const service of services) {
    for (const city of serviceAreaCities) {
      crossLinks.push({
        serviceName: service.name,
        cityName: city.name,
        serviceSlug: service.slug,
        citySlug: city.slug,
        url: getServiceLocationUrl(service.slug, city.slug),
      });
    }
  }

  return { serviceLinks, locationLinks, crossLinks };
}

export type BlogCategory = (typeof siteConfig.blogCategories)[number];

/**
 * Services with pre-built URLs — use this in components instead of `siteConfig.services`.
 */
export const servicesWithUrls = services.map((s) => ({
  ...s,
  url: getServicePageUrl(s.slug),
}));

export const citiesWithUrls = serviceAreaCities.map((c) => ({
  ...c,
  url: getLocationPageUrl(c.slug),
}));
