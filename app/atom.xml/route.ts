import { Feed } from "feed";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

/**
 * Atom 1.0 feed endpoint. Serves at /atom.xml — same content as RSS,
 * Atom format. Mirrors the QC/Viking blog feed, adapted to Outdoor Renovations.
 */
export async function GET() {
  const posts = await getAllPosts();

  const feed = new Feed({
    title: `${siteConfig.shortName} Blog`,
    description: siteConfig.description,
    id: siteConfig.blogUrl,
    link: siteConfig.blogUrl,
    language: "en",
    favicon: `${siteConfig.blogUrl}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${siteConfig.companyName}. All rights reserved.`,
    feedLinks: {
      rss2: `${siteConfig.blogUrl}/feed.xml`,
      atom: `${siteConfig.blogUrl}/atom.xml`,
    },
    author: {
      name: siteConfig.shortName,
      link: siteConfig.mainSiteUrl,
    },
  });

  for (const post of posts) {
    const url = `${siteConfig.blogUrl}/blog/${post.slug}`;
    feed.addItem({
      title: post.frontmatter.title,
      id: url,
      link: url,
      description: post.frontmatter.metaDescription,
      content: post.content,
      author: [{ name: post.frontmatter.author || siteConfig.shortName, link: siteConfig.mainSiteUrl }],
      date: new Date(post.frontmatter.publishDate),
      category: [
        { name: post.frontmatter.category },
        ...post.frontmatter.tags.map((tag) => ({ name: tag })),
      ],
    });
  }

  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
