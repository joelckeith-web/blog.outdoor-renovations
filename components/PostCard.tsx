import Link from "next/link";
import type { BlogPost } from "@/lib/types";

const categoryColors: Record<string, string> = {
  "landscape-design": "bg-green-100 text-green-800",
  hardscaping: "bg-stone-100 text-stone-700",
  "irrigation-systems": "bg-blue-100 text-blue-700",
  "outdoor-living-spaces": "bg-amber-100 text-amber-700",
  "lawn-care": "bg-emerald-100 text-emerald-700",
  "tree-shrub-care": "bg-lime-100 text-lime-800",
  "drainage-solutions": "bg-cyan-100 text-cyan-700",
  xeriscaping: "bg-orange-100 text-orange-700",
  general: "bg-gray-100 text-gray-700",
};

export default function PostCard({ post }: { post: BlogPost }) {
  const { frontmatter, readingTime } = post;

  const categoryColor =
    categoryColors[frontmatter.category] || categoryColors.general;

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Featured image placeholder */}
      <div className="h-48 bg-gradient-to-br from-brand-dark to-brand-dark-secondary flex items-center justify-center">
        {frontmatter.weatherTriggered && (
          <div className="text-center text-white">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <span className="text-xs opacity-60">Weather Report</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Category + date */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${categoryColor}`}
          >
            {frontmatter.category.replace(/-/g, " ")}
          </span>
          <time
            dateTime={frontmatter.publishDate}
            className="text-xs text-gray-500"
          >
            {new Date(frontmatter.publishDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-brand-dark mb-2 group-hover:text-brand-accent transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`}>{frontmatter.title}</Link>
        </h2>

        {/* Description */}
        <p className="text-sm text-brand-text-secondary mb-4 line-clamp-3">
          {frontmatter.metaDescription}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{readingTime}</span>
          {frontmatter.weatherTriggered && (
            <span className="text-xs text-brand-accent font-medium">
              {frontmatter.weatherWeek}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
