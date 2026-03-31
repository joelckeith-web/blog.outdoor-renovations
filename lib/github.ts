import type { GeneratedBlog } from "./types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "joelckeith-web";
const GITHUB_REPO = process.env.GITHUB_REPO || "blog.outdoor-renovations";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

interface GitHubFileResponse {
  content: string;
  sha: string;
}

async function githubAPI(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Get file content from GitHub. Returns decoded UTF-8 string or null if 404.
 */
export async function getFileFromGitHub(
  filePath: string
): Promise<string | null> {
  try {
    const data: GitHubFileResponse = await githubAPI(
      `/contents/${filePath}?ref=${GITHUB_BRANCH}`
    );
    // GitHub returns Base64-encoded content
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (err) {
    // 404 = file does not exist, return null
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

/**
 * Push (create or update) a file to GitHub.
 * Handles SHA lookup for updates vs creates automatically.
 * Returns the commit URL.
 */
export async function pushFileToGitHub(
  filePath: string,
  content: string,
  message: string
): Promise<string> {
  const contentBase64 = Buffer.from(content).toString("base64");

  // Check if file already exists (to get SHA for update)
  let sha: string | undefined;
  try {
    const existing: GitHubFileResponse = await githubAPI(
      `/contents/${filePath}?ref=${GITHUB_BRANCH}`
    );
    sha = existing.sha;
  } catch {
    // File doesn't exist, that's fine -- will create
  }

  const result = await githubAPI(`/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  return result.content.html_url;
}

/**
 * Push a generated blog post to GitHub.
 * Uses the blog's filePath and markdownContent.
 */
export async function pushPostToGitHub(blog: GeneratedBlog): Promise<string> {
  return pushFileToGitHub(
    blog.filePath,
    blog.markdownContent,
    `Add blog post: ${blog.frontmatter.title}`
  );
}
