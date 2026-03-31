import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { BreadcrumbSchema } from "@/components/SchemaMarkup";
import { siteConfig, servicesWithUrls } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Austin Landscaping Blog | ${siteConfig.shortName}`,
  description: `Expert tips on landscape design, hardscaping, irrigation, and lawn care in ${siteConfig.primaryCity}, TX. Weather-informed landscaping advice from ${siteConfig.companyName}.`,
};

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: siteConfig.mainSiteUrl },
          { name: "Blog", url: siteConfig.blogUrl },
        ]}
      />

      {/* Hero section */}
      <section className="bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-heading font-extrabold mb-4">
              Austin Landscaping Blog
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Expert advice on landscape design, hardscaping, and outdoor living
              — powered by real local weather data for{" "}
              {siteConfig.primaryCity},{" "}
              {siteConfig.primaryState} and Central Texas.
            </p>
            <div className="flex flex-wrap gap-2">
              {servicesWithUrls.map((service) => (
                <a
                  key={service.url}
                  href={service.url}
                  className="text-sm bg-white/10 hover:bg-brand-accent px-3 py-1.5 rounded-full transition-colors"
                >
                  {service.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog posts grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-brand-dark mb-2">
              Blog Coming Soon
            </h2>
            <p className="text-brand-text-secondary max-w-md mx-auto">
              We&apos;re preparing expert landscaping content for {siteConfig.primaryCity}{" "}
              homeowners. Check back soon for weather-informed tips and guides.
            </p>
            <a
              href={siteConfig.keyPages.contact}
              className="inline-block mt-6 btn-primary"
            >
              Contact Us Today
            </a>
          </div>
        )}
      </section>

      {/* CTA section — cream bg with green accents */}
      <section className="bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-heading font-extrabold text-brand-dark-secondary mb-3">
            Need Landscaping Service?
          </h2>
          <p className="text-brand-text-secondary mb-6 max-w-2xl mx-auto font-body">
            From landscape design to hardscaping and irrigation,{" "}
            {siteConfig.companyName} is your trusted local landscaping contractor in{" "}
            {siteConfig.primaryCity}, {siteConfig.primaryState}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={siteConfig.keyPages.contact}
              className="inline-block bg-brand-dark text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-dark-secondary transition-colors"
            >
              Get a Consultation
            </a>
            <a
              href={`tel:${siteConfig.phoneRaw}`}
              className="inline-block border-2 border-brand-dark text-brand-dark font-semibold px-6 py-3 rounded-md hover:bg-brand-dark hover:text-white transition-colors"
            >
              Call {siteConfig.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
