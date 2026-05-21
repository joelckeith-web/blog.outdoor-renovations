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
      // Scripts: self + Next.js inline/eval requirements
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (Tailwind)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + OR's own domains (verified — pipeline emits only these)
      "img-src 'self' data: https://www.outdoorreno.com https://outdoorreno.com https://blog.outdoorreno.com https://www.outdoorrenovations.com",
      // Fonts: self + Google Fonts (defense in depth if next/font emits them)
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      // Connect: self
      "connect-src 'self'",
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

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["blog.outdoorreno.com", "outdoorreno.com"],
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
