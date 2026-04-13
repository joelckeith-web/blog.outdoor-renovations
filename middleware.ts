import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: redirect non-canonical hostnames to blog.outdoorreno.com.
 * Prevents duplicate content on blogoutdoor-renovations.vercel.app
 * and any other Vercel preview/alias URLs.
 */
const CANONICAL_HOST = "blog.outdoorreno.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Allow canonical hostname and localhost
  if (host === CANONICAL_HOST || host.startsWith("localhost")) {
    return NextResponse.next();
  }

  // Allow Vercel preview deployments (hash-based URLs used for PR previews)
  if (host.includes("-joelckeith-9717s-projects.vercel.app")) {
    return NextResponse.next();
  }

  // Redirect everything else (blogoutdoor-renovations.vercel.app, etc.)
  // to the canonical blog domain with a 308 permanent redirect
  const url = request.nextUrl.clone();
  url.host = CANONICAL_HOST;
  url.protocol = "https";
  url.port = "";

  return NextResponse.redirect(url, 308);
}

export const config = {
  // Run on all routes except API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
