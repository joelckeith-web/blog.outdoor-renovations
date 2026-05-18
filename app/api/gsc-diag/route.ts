/**
 * One-off GSC diagnostic for outdoorreno.com.
 * Reuses the blog-indexing service account (already a verified Owner of the
 * Search Console property — Indexing API requires ownership), so no SA-grant
 * or impersonation is needed. Auth-guarded with CRON_SECRET, same as the cron.
 *
 * Call: curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *   "https://blog.outdoorreno.com/api/gsc-diag"
 */

import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";

export const maxDuration = 60;

const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const START = "2026-04-01";
const END = "2026-05-15";
const SITE_CANDIDATES = [
  "sc-domain:outdoorreno.com",
  "https://www.outdoorreno.com/",
  "https://outdoorreno.com/",
];

async function sc(token: string, path: string, body?: unknown) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    return NextResponse.json(
      { error: "GOOGLE_INDEXING_CLIENT_EMAIL / _PRIVATE_KEY not set" },
      { status: 500 }
    );
  }

  const out: Record<string, unknown> = {
    serviceAccount: clientEmail,
    window: { start: START, end: END },
  };

  try {
    const token = await getGoogleAccessToken(
      clientEmail,
      privateKey,
      WEBMASTERS_SCOPE
    );

    const sites = await sc(token, "/sites");
    out.accessibleSites = sites.ok
      ? (sites.json.siteEntry || []).map(
          (s: { siteUrl: string; permissionLevel: string }) =>
            `${s.siteUrl} [${s.permissionLevel}]`
        )
      : { status: sites.status, error: sites.json };

    const siteUrl =
      (sites.ok &&
        (sites.json.siteEntry || [])
          .map((s: { siteUrl: string }) => s.siteUrl)
          .find((u: string) => u.includes("outdoorreno.com"))) ||
      SITE_CANDIDATES[0];
    out.querySiteUrl = siteUrl;

    const enc = encodeURIComponent(siteUrl);
    const q = (dimensions: string[], rowLimit: number) =>
      sc(token, `/sites/${enc}/searchAnalytics/query`, {
        startDate: START,
        endDate: END,
        dimensions,
        rowLimit,
      });

    const [byDate, byQuery, byPage] = await Promise.all([
      q(["date"], 100),
      q(["query"], 30),
      q(["page"], 30),
    ]);

    out.gsc = {
      byDate: byDate.ok ? byDate.json.rows || [] : { status: byDate.status, error: byDate.json },
      topQueries: byQuery.ok ? byQuery.json.rows || [] : { status: byQuery.status, error: byQuery.json },
      topPages: byPage.ok ? byPage.json.rows || [] : { status: byPage.status, error: byPage.json },
    };
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(out);
}
