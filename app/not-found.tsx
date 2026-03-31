import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-brand-accent mb-4">404</h1>
      <h2 className="text-2xl font-bold text-brand-dark mb-4">
        Page Not Found
      </h2>
      <p className="text-brand-text-secondary mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/" className="btn-primary">
          Back to Blog
        </Link>
        <a
          href={siteConfig.keyPages.contact}
          className="btn-secondary"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
