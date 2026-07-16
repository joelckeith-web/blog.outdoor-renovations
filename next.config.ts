import type { NextConfig } from "next";

/**
 * Security headers applied to all routes.
 * Mirrors the QC/Viking blog config, adapted to OR's image hosts. OR
 * self-hosts all images on its own domains and runs NO third-party tags
 * (no Meta Pixel / analytics), so the CSP can stay strict — no facebook /
 * googleusercontent allowances needed.
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
 */
const securityHeaders = [
  // Prevent clickjacking — blog should never be iframed
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Enable HSTS — force HTTPS for 2 years, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Control referrer info sent with requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // XSS protection (legacy browsers)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Content Security Policy — strict; OR self-hosts all images on its domains
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline/eval requirements + GTM (added
      // 2026-07-16 — blog joined the main site's GTM container)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      // Styles: self + inline (Tailwind)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + OR's own domains + GA/GTM beacons
      "img-src 'self' data: https://www.outdoorreno.com https://outdoorreno.com https://blog.outdoorreno.com https://www.outdoorrenovations.com https://www.googletagmanager.com https://www.google-analytics.com",
      // Fonts: self + Google Fonts (defense in depth if next/font emits them)
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      // Connect: self + GA4 collection endpoints (incl. regional hosts)
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://analytics.google.com",
      // Frames: GTM noscript iframe only
      "frame-src https://www.googletagmanager.com",
      // Object embeds: none
      "object-src 'none'",
      // Frame ancestors: none (same as X-Frame-Options DENY)
      "frame-ancestors 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self only (defense in depth)
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/**
 * 2026-07-16 weather-post consolidation: 30 weather-triggered posts merged
 * into the Central Texas storm prep guide. Old slugs 301/308 to the guide.
 */
const consolidatedWeatherSlugs = [
  "storm-damage-assessment-heavy-rain-prep-in-westlake-hills",
  "bee-cave-storm-prep-wind-damage-check-severe-weather-protection",
  "preparing-lakeway-properties-for-severe-storm-season-drainage-protection",
  "severe-storm-recovery-prep-lakeway-drainage-solutions-this-week",
  "storm-damage-more-rain-coming-dripping-springs-emergency-guide",
  "lakeway-storm-prep-protect-your-landscape-before-april-rains",
  "storm-proof-your-lakeway-landscape-before-april-s-severe-weather",
  "pre-storm-drainage-prep-for-bee-cave-heavy-rain-coming-april-2026",
  "prepare-your-lakeway-property-for-severe-storms-this-week",
  "prepare-your-bee-cave-landscape-for-heavy-rain-and-storm-season",
  "storm-proofing-dripping-springs-prepare-for-severe-weather-this-week",
  "storm-ready-drainage-dripping-springs-april-storm-preparation-guide",
  "storm-ready-drainage-prepare-your-tarrytown-landscape-for-heavy-rain",
  "severe-storm-prep-for-tarrytown-properties-april-27-may-3-2026",
  "severe-storm-preparation-barton-creek-drainage-landscape-protection",
  "storm-damage-recovery-preparing-for-more-rain-this-week",
  "storm-ready-drainage-preparing-steiner-ranch-properties-may-7-13",
  "storm-recovery-prep-guide-for-circle-c-ranch-homeowners",
  "travis-heights-storm-prep-heavy-rain-flooding-protection-this-week",
  "severe-storms-hit-westlake-hills-prep-your-landscape-for-week-of-rain",
  "storm-recovery-prep-lakeway-drainage-solutions-after-0-69-rain",
  "storm-damage-recovery-heavy-rain-prep-for-bee-cave-properties",
  "severe-storm-prep-protecting-your-dripping-springs-landscape",
  "prepare-your-tarrytown-landscape-for-severe-storms-this-week",
  "barton-creek-storm-recovery-urgent-drainage-repairs-after-1-75-rain",
  "storm-recovery-preparation-guide-for-rollingwood-properties",
  "storm-prep-for-steiner-ranch-drainage-outdoor-structure-protection",
  "circle-c-ranch-storm-damage-drainage-solutions-after-2-88-rain",
  "travis-heights-storm-prep-protect-drainage-before-this-week-s-rain",
  "westlake-hills-storm-prep-protect-drainage-before-rain-hits",
  "dripping-springs-flood-watch-protect-your-yard-before-the-heat-hits",
];

const nextConfig: NextConfig = {
  output: "standalone",

  // 2026-07-16 subdomain → subdirectory migration: the blog serves under
  // outdoorreno.com/blog via a rewrite in the main site. basePath keeps
  // every route and asset (/blog/_next/*) under the proxied prefix.
  // blog.outdoorreno.com now blanket-301s to the main domain (middleware.ts).
  basePath: "/blog",

  images: {
    domains: ["blog.outdoorreno.com", "outdoorreno.com"],
  },

  async redirects() {
    // Sources/destinations are basePath-relative — Next prefixes both
    // with /blog automatically.
    return consolidatedWeatherSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: "/central-texas-storm-prep-drainage-guide",
      permanent: true,
    }));
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Disable x-powered-by header (leaks framework info)
  poweredByHeader: false,
};

export default nextConfig;
