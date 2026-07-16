import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { buildWeatherContext } from "../lib/weather";
import { getFileFromGitHub, pushFileToGitHub } from "../lib/github";
import type { WeatherContext, WeatherAlert } from "../lib/types";

/**
 * Weekly storm-guide updater — replaces the retired create-a-new-post
 * weather pipeline (posts consolidated 2026-07-16).
 *
 * Behavior:
 *  - Fetches the NWS weather context for the Austin metro.
 *  - Applies a TIGHTENED trigger gate (the old pipeline fired on 0.69" of
 *    rain; this one requires a real event — see shouldTrigger()).
 *  - If triggered: rewrites ONLY the CURRENT-CONDITIONS block of the
 *    flagship guide and bumps `lastUpdated`. Never creates files, never
 *    touches anything outside the markers.
 *  - If not triggered: resets the block to the quiet default ONLY if a
 *    previous alert is still displayed (so stale warnings clear themselves),
 *    otherwise exits without changes. Silence is a valid outcome.
 *
 * The blurb is composed from a deterministic template using NWS data
 * fields — no LLM call, so fabricated stats/citations are structurally
 * impossible in this path.
 */

const GUIDE_PATH =
  "content/posts/2026-07-16-central-texas-storm-prep-drainage-guide.md";
const MARKER_START = "<!-- CURRENT-CONDITIONS:START -->";
const MARKER_END = "<!-- CURRENT-CONDITIONS:END -->";

const QUIET_DEFAULT = `**Current conditions:** No active severe weather alerts for the Austin area right now. This guide is updated when significant weather approaches — check back before the next storm, or use the prep checklist below any time.`;

const shouldPush = process.argv.includes("--push");

// ── Trigger gate ────────────────────────────────────────────────
// Storm-guide-relevant NWS alert events (the guide covers storms/rain/
// wind/flood — heat and air-quality alerts are out of scope).
const RELEVANT_ALERT = /flood|storm|tornado|wind|hail|rain|hurricane|ice|winter|freeze/i;

interface TriggerResult {
  triggered: boolean;
  reason: string;
  alert?: WeatherAlert;
}

function shouldTrigger(ctx: WeatherContext): TriggerResult {
  // 1. An active, relevant NWS watch/warning is the strongest signal.
  const alert = ctx.forecast.alerts.find(
    (a) =>
      RELEVANT_ALERT.test(a.event) &&
      /warning|watch/i.test(a.event) &&
      /severe|extreme|moderate/i.test(a.severity)
  );
  if (alert) return { triggered: true, reason: `NWS alert: ${alert.event}`, alert };

  // 2. Significant recent rainfall or wind (post-event mode).
  //    Old pipeline fired at 0.69" — this gate requires 1.5"+ or 40mph+ gusts.
  if (ctx.historical.totalPrecipitation >= 1.5) {
    return {
      triggered: true,
      reason: `heavy recent rain: ${ctx.historical.totalPrecipitation.toFixed(2)}" in 48h`,
    };
  }
  if (ctx.historical.peakWindGust >= 40) {
    return {
      triggered: true,
      reason: `high winds: ${Math.round(ctx.historical.peakWindGust)} mph gusts`,
    };
  }

  // 3. Forecast storm risk flags (pre-event mode) — require the summary's
  //    storm/heavy-rain/hail flags, not mere "precipitation days".
  const s = ctx.forecast.summary;
  if (s.stormRisk || s.heavyRainRisk || s.hailRisk || s.iceStormRisk) {
    return { triggered: true, reason: `forecast risk flags (${ctx.dominantHazard})` };
  }

  return { triggered: false, reason: "no qualifying weather event" };
}

// ── Deterministic blurb template ────────────────────────────────
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const HAZARD_ADVICE: Array<[RegExp, string]> = [
  [/flood|rain/i, "Clear your drain inlets, swales, and downspout outlets now, and skip irrigation until it passes — the prep checklist below covers the rest."],
  [/tornado|wind/i, "Secure loose patio furniture and planters, and check for weak or hanging limbs over structures before it arrives."],
  [/hail/i, "Move container plants under cover if you can — for everything else, the after-storm damage checklist below tells you what to look for once it passes."],
  [/ice|winter|freeze/i, "Disconnect hoses, insulate exposed backflow preventers and pipes, and water plants deeply before the freeze — moist soil holds warmth better than dry."],
  [/storm/i, "Run the before-a-storm checklist below, and walk the property afterward while the water lines are still visible."],
];

function adviceFor(text: string): string {
  for (const [re, advice] of HAZARD_ADVICE) {
    if (re.test(text)) return advice;
  }
  return "Run the before-a-storm checklist below, and walk the property afterward while the water lines are still visible.";
}

function buildBlurb(ctx: WeatherContext, trig: TriggerResult, today: Date): string {
  const dateLabel = formatDate(today);
  if (trig.alert) {
    return `**Current conditions (updated ${dateLabel}):** The National Weather Service has issued a ${trig.alert.event} covering the Austin area (${ctx.weekLabel}). ${adviceFor(trig.alert.event)}`;
  }
  if (trig.reason.startsWith("heavy recent rain") || trig.reason.startsWith("high winds")) {
    return `**Current conditions (updated ${dateLabel}):** Significant weather just moved through the Austin area — ${ctx.historicalSummary.trim()} ${adviceFor(trig.reason)} The after-storm damage checklist below covers what to look for.`;
  }
  return `**Current conditions (updated ${dateLabel}):** Storms are in the Austin-area forecast for ${ctx.weekLabel}. ${adviceFor(ctx.dominantHazard)}`;
}

// ── Guide surgery ───────────────────────────────────────────────
function replaceConditionsBlock(guide: string, blurb: string): string {
  const start = guide.indexOf(MARKER_START);
  const end = guide.indexOf(MARKER_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      "CURRENT-CONDITIONS markers not found in guide — refusing to edit. " +
        "Check that the guide still contains both marker comments."
    );
  }
  return (
    guide.slice(0, start + MARKER_START.length) +
    "\n" +
    blurb +
    "\n" +
    guide.slice(end)
  );
}

function bumpLastUpdated(guide: string, today: Date): string {
  const iso = today.toISOString().slice(0, 10);
  const updated = guide.replace(/^lastUpdated: "\d{4}-\d{2}-\d{2}"$/m, `lastUpdated: "${iso}"`);
  if (updated === guide && !guide.includes(`lastUpdated: "${iso}"`)) {
    throw new Error("lastUpdated field not found in guide frontmatter — refusing to edit.");
  }
  return updated;
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log("=== Storm Guide Updater ===\n");
  const today = new Date();

  console.log("Fetching weather context for Austin, TX...");
  const ctx = await buildWeatherContext();
  const trig = shouldTrigger(ctx);
  console.log(`Trigger: ${trig.triggered} (${trig.reason})`);

  // Read the guide (from GitHub when pushing, local file otherwise)
  const localPath = path.join(process.cwd(), GUIDE_PATH);
  const guide = shouldPush
    ? await getFileFromGitHub(GUIDE_PATH)
    : fs.readFileSync(localPath, "utf-8");
  if (!guide) throw new Error(`Guide not found at ${GUIDE_PATH}`);

  const currentBlock = guide.slice(
    guide.indexOf(MARKER_START) + MARKER_START.length,
    guide.indexOf(MARKER_END)
  );
  const isQuietNow = currentBlock.includes("No active severe weather alerts");

  let blurb: string;
  if (trig.triggered) {
    blurb = buildBlurb(ctx, trig, today);
  } else if (!isQuietNow) {
    // A previous alert is still displayed but the weather has passed — clear it.
    blurb = QUIET_DEFAULT;
    console.log("Clearing stale alert back to quiet default.");
  } else {
    console.log("Quiet weather, quiet guide — no update needed. Exiting.");
    return;
  }

  let updated = replaceConditionsBlock(guide, blurb);
  updated = bumpLastUpdated(updated, today);

  if (updated === guide) {
    console.log("Content unchanged — nothing to push.");
    return;
  }

  if (shouldPush) {
    const url = await pushFileToGitHub(
      GUIDE_PATH,
      updated,
      `Storm guide conditions update: ${trig.triggered ? trig.reason : "clear stale alert"}`
    );
    console.log(`Pushed: ${url}`);
  } else {
    fs.writeFileSync(localPath, updated, "utf-8");
    console.log(`Updated locally (dry run): ${localPath}`);
  }
  console.log(`\nBlock now reads:\n${blurb}`);
}

main().catch((err) => {
  console.error("Storm guide update failed:", err);
  process.exit(1);
});
