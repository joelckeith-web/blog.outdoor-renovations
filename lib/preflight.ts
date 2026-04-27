/**
 * Pre-flight checks that validate every external dependency the cron needs
 * BEFORE the expensive Claude generation step. Each failure throws an Error
 * with the exact remediation in the message, so logs surface "rotate the key"
 * not "blog generation failed."
 *
 * Why: on 2026-04-23 the Anthropic key went invalid and we burned an entire
 * scheduled run discovering it from the Anthropic SDK's generic auth error,
 * deep inside the call stack. Pre-flight runs the same authentication path
 * with a 1-token ping (~$0.000005) and fails immediately if anything is wrong.
 */

const ANTHROPIC_PING_MODEL = "claude-haiku-4-5-20251001";

class PreflightError extends Error {
  constructor(message: string) {
    super(`[PREFLIGHT] ${message}`);
    this.name = "PreflightError";
  }
}

async function validateAnthropicKey(): Promise<void> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new PreflightError(
      "ANTHROPIC_API_KEY env var is not set. Set it in GitHub repo secrets (Actions runs) or Vercel project env (cron route runs)."
    );
  }
  if (!key.startsWith("sk-ant-")) {
    throw new PreflightError(
      `ANTHROPIC_API_KEY format invalid (got prefix: "${key.slice(0, 10)}..."). Real keys start with "sk-ant-".`
    );
  }

  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_PING_MODEL,
        max_tokens: 1,
        messages: [{ role: "user", content: "ok" }],
      }),
    });
  } catch (err) {
    throw new PreflightError(
      `Could not reach Anthropic API at all (network failure): ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (resp.status === 401) {
    throw new PreflightError(
      "Anthropic returned 401 invalid x-api-key. The key has been rotated or revoked. Update ANTHROPIC_API_KEY in BOTH the Vercel project env AND the GitHub repo secret, then redeploy."
    );
  }
  if (resp.status === 429) {
    throw new PreflightError(
      "Anthropic returned 429 rate-limited. Either wait or check the org's rate-limit dashboard."
    );
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => "(no body)");
    throw new PreflightError(
      `Anthropic API returned HTTP ${resp.status}: ${body.slice(0, 300)}`
    );
  }
}

async function validateGitHubAccess(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token) throw new PreflightError("GITHUB_TOKEN env var is not set.");
  if (!owner) throw new PreflightError("GITHUB_OWNER env var is not set.");
  if (!repo) throw new PreflightError("GITHUB_REPO env var is not set.");

  let resp: Response;
  try {
    resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "asp-branding-cron-preflight",
      },
    });
  } catch (err) {
    throw new PreflightError(
      `Could not reach GitHub API at all (network failure): ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (resp.status === 401) {
    throw new PreflightError(
      `GitHub token rejected (401). Token is expired or revoked. Rotate GITHUB_TOKEN in Vercel env and GitHub repo secrets.`
    );
  }
  if (resp.status === 403) {
    throw new PreflightError(
      `GitHub token returned 403 (forbidden) for ${owner}/${repo}. Token lacks repo scopes or rate limit hit.`
    );
  }
  if (resp.status === 404) {
    throw new PreflightError(
      `Repo ${owner}/${repo} not found, or token cannot see it. Check token scopes.`
    );
  }
  if (!resp.ok) {
    throw new PreflightError(
      `GitHub repo lookup returned HTTP ${resp.status} for ${owner}/${repo}.`
    );
  }
}

/**
 * Run all pre-flight checks in parallel. Throws PreflightError on the first
 * failure with a remediation-focused message. Returns silently on success.
 */
export async function runPreflight(): Promise<void> {
  console.log("[PREFLIGHT] Validating Anthropic key + GitHub access...");
  const start = Date.now();
  await Promise.all([validateAnthropicKey(), validateGitHubAccess()]);
  console.log(`[PREFLIGHT] All checks passed in ${Date.now() - start}ms`);
}
