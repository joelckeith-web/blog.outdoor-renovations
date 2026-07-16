import { NextRequest, NextResponse } from "next/server";

/**
 * 2026-07-16 subdomain → subdirectory migration.
 *
 * The blog now serves at www.outdoorreno.com/blog via a rewrite in the
 * main site (proxied to this deployment's vercel.app domain, which must
 * therefore be allowed to serve). blog.outdoorreno.com is retired:
 * EVERY request to it gets a permanent 301 to the equivalent main-domain
 * URL so no subdomain URL survives —
 *   blog.outdoorreno.com/                → www.outdoorreno.com/blog
 *   blog.outdoorreno.com/blog/<slug>     → www.outdoorreno.com/blog/<slug>
 *   blog.outdoorreno.com/feed.xml        → www.outdoorreno.com/blog/feed.xml
 *   blog.outdoorreno.com/sitemap.xml     → www.outdoorreno.com/blog/sitemap.xml
 *   (any other path)                     → www.outdoorreno.com/blog<path>
 */
const RETIRED_HOST = "blog.outdoorreno.com";
const MAIN_ORIGIN = "https://www.outdoorreno.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host === RETIRED_HOST) {
    // NOTE: with basePath "/blog", request.nextUrl.pathname excludes the
    // basePath for matched routes; use the raw URL path to be safe.
    const rawPath = new URL(request.url).pathname;
    const mapped = rawPath.startsWith("/blog")
      ? rawPath
      : `/blog${rawPath === "/" ? "" : rawPath}`;
    const search = new URL(request.url).search;
    return NextResponse.redirect(`${MAIN_ORIGIN}${mapped}${search}`, 301);
  }

  // Serve for: the vercel.app production domain (proxy origin for the
  // main site's /blog rewrite), preview deployments, and localhost.
  return NextResponse.next();
}

export const config = {
  // Run on all routes except API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
