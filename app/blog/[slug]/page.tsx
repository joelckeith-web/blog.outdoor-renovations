import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getAllPostSlugs, getRecentPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import ServiceAreaFooter from "@/components/ServiceAreaFooter";
import {
  ArticleSchema,
  FaqSchema,
  BreadcrumbSchema,
} from "@/components/SchemaMarkup";
import { siteConfig, services, getServicePageUrl } from "@/lib/site-config";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.frontmatter.metaTitle || post.frontmatter.title,
    description: post.frontmatter.metaDescription,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.metaDescription,
      type: "article",
      publishedTime: post.frontmatter.publishDate,
      authors: [siteConfig.companyName],
      tags: post.frontmatter.tags,
    },
    alternates: {
      canonical: `${siteConfig.blogUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const recentPosts = await getRecentPosts(3, slug);

  return (
    <>
      {/* Schema markup */}
      <ArticleSchema post={post} />
      <FaqSchema items={post.frontmatter.schema?.faqItems || []} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: siteConfig.mainSiteUrl },
          { name: "Blog", url: siteConfig.blogUrl },
          {
            name: post.frontmatter.title,
            url: `${siteConfig.blogUrl}/blog/${post.slug}`,
          },
        ]}
      />

      <article>
        {/* Post header */}
        <header className="bg-brand-dark text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-400 mb-6">
              <a
                href={siteConfig.mainSiteUrl}
                className="hover:text-brand-accent transition-colors"
              >
                Home
              </a>
              <span className="mx-2">/</span>
              <Link
                href="/"
                className="hover:text-brand-accent transition-colors"
              >
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-300 capitalize">
                {post.frontmatter.category.replace(/-/g, " ")}
              </span>
            </nav>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-semibold bg-brand-accent px-3 py-1 rounded-full capitalize">
                {post.frontmatter.category.replace(/-/g, " ")}
              </span>
              <time
                dateTime={post.frontmatter.publishDate}
                className="text-sm text-gray-300"
              >
                {new Date(post.frontmatter.publishDate).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </time>
              <span className="text-sm text-gray-400">
                · {post.readingTime}
              </span>
              {post.frontmatter.weatherTriggered && (
                <span className="text-sm text-brand-accent">
                  {post.frontmatter.weatherMode === "post-event"
                    ? "Post-Storm Report"
                    : post.frontmatter.weatherMode === "combined"
                      ? "Weather Advisory"
                      : "Weather Forecast"}: {post.frontmatter.weatherWeek}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
              {post.frontmatter.title}
            </h1>
          </div>
        </header>

        {/* Featured Image */}
        {post.frontmatter.featuredImage && (
          <div className="max-w-4xl mx-auto px-4 -mt-4">
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${siteConfig.mainSiteUrl}${post.frontmatter.featuredImage}`}
                alt={post.frontmatter.featuredImageAlt || `${post.frontmatter.title} — Outdoor Renovations`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Post content */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="lg:flex lg:gap-12">
            {/* Main content */}
            <div className="lg:flex-1 min-w-0">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Service Area Geo-Link Footer */}
              {post.frontmatter.serviceAreaFooterLinks?.length > 0 && (
                <ServiceAreaFooter
                  links={post.frontmatter.serviceAreaFooterLinks}
                />
              )}

              {/* FAQ section */}
              {post.frontmatter.schema?.faqItems?.length > 0 && (
                <section className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-brand-dark mb-6">
                    Frequently Asked Questions
                  </h2>
                  <div className="faq-section space-y-1">
                    {post.frontmatter.schema.faqItems.map((faq, index) => (
                      <details key={index}>
                        <summary className="py-4 text-base">
                          {faq.question}
                        </summary>
                        <p className="pb-4 text-brand-text-secondary leading-relaxed">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="mt-12 bg-brand-accent-light rounded-lg p-8 text-center">
                <h3 className="text-xl font-bold text-brand-dark mb-2">
                  Need Landscaping Service in {siteConfig.primaryCity}?
                </h3>
                <p className="text-brand-text-secondary mb-4">
                  Contact {siteConfig.companyName} today for{" "}
                  {post.frontmatter.category.replace(/-/g, " ")} services in{" "}
                  {siteConfig.primaryCity}, {siteConfig.primaryState}.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={siteConfig.keyPages.contact}
                    className="btn-primary"
                  >
                    Get a Free Quote
                  </a>
                  <a
                    href={`tel:${siteConfig.phoneRaw}`}
                    className="btn-secondary"
                  >
                    Call {siteConfig.phone}
                  </a>
                </div>
              </div>

              {/* Tags */}
              {post.frontmatter.tags?.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {post.frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-72 shrink-0 mt-12 lg:mt-0">
              <div className="sticky top-24 space-y-8">
                {/* Contact card */}
                <div className="bg-brand-dark text-white rounded-lg p-6">
                  <h3 className="font-bold text-brand-accent mb-3">
                    Need Help?
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Call us for a free landscaping consultation.
                  </p>
                  <a
                    href={`tel:${siteConfig.phoneRaw}`}
                    className="block text-center btn-primary text-sm w-full"
                  >
                    {siteConfig.phone}
                  </a>
                </div>

                {/* Services list */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold text-brand-dark mb-3">
                    Our Services
                  </h3>
                  <ul className="space-y-2">
                    {services.map((service) => (
                      <li key={service.slug}>
                        <a
                          href={getServicePageUrl(service.slug)}
                          className="text-sm text-brand-text-secondary hover:text-brand-accent transition-colors"
                        >
                          &rarr; {service.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {recentPosts.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-brand-dark mb-8">
              More From Our Blog
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentPosts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
