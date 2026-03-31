import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, BlogFrontmatter } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

/**
 * Get all published blog posts, sorted by date (newest first).
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();

  const posts: BlogPost[] = [];

  for (const file of files) {
    const post = await getPostByFile(path.join(POSTS_DIR, file));
    if (post) posts.push(post);
  }

  return posts;
}

/**
 * Get a single post by slug.
 */
export async function getPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  if (!fs.existsSync(POSTS_DIR)) return null;

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    if (data.slug === slug) {
      return getPostByFile(filePath);
    }
  }

  return null;
}

/**
 * Get all post slugs for static generation.
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return data.slug as string;
    })
    .filter(Boolean);
}

/**
 * Parse a markdown file into a BlogPost.
 */
async function getPostByFile(filePath: string): Promise<BlogPost | null> {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const frontmatter = data as BlogFrontmatter;

    const wordCount = content.split(/\s+/).length;
    const readingTime = `${Math.ceil(wordCount / 200)} min read`;

    return {
      frontmatter,
      content,
      slug: frontmatter.slug || path.basename(filePath, ".md"),
      readingTime,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Get recent posts for sidebar/related posts.
 */
export async function getRecentPosts(
  limit: number = 5,
  excludeSlug?: string
): Promise<BlogPost[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

/**
 * Get posts by category.
 */
export async function getPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.frontmatter.category === category);
}

/**
 * Get posts filtered by target city.
 */
export async function getPostsByCity(city: string): Promise<BlogPost[]> {
  const all = await getAllPosts();
  return all.filter(
    (p) =>
      p.frontmatter.targetCity &&
      p.frontmatter.targetCity.toLowerCase() === city.toLowerCase()
  );
}
