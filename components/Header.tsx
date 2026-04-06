"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig, servicesWithUrls } from "@/lib/site-config";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <>
      {/* Top bar — phone + license */}
      <div className="bg-brand-dark text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <span className="hidden sm:inline text-gray-300">
            {siteConfig.license} | Serving Austin &amp; Central Texas
          </span>
          <a
            href={`tel:${siteConfig.phoneRaw}`}
            className="font-semibold hover:text-brand-accent transition-colors"
          >
            {siteConfig.phone}
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo / Brand */}
            <Link
              href={siteConfig.mainSiteUrl}
              className="flex items-center shrink-0"
            >
              <span className="font-heading font-extrabold text-xl md:text-2xl text-brand-dark-secondary tracking-tight">
                Outdoor Renovations
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink href={siteConfig.mainSiteUrl} label="Home" />
              <NavLink href={siteConfig.keyPages.about} label="About Us" />

              {/* Services dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <span className="px-3 py-2 text-brand-text-secondary hover:text-brand-accent font-medium transition-colors inline-flex items-center cursor-pointer">
                  Services
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>

                {servicesOpen && (
                  <div className="absolute top-full left-0 w-56 bg-white shadow-lg rounded-b-lg border-t-2 border-brand-accent py-2 z-50">
                    {servicesWithUrls.map((service) => (
                      <a
                        key={service.url}
                        href={service.url}
                        className="block px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-accent-light hover:text-brand-accent transition-colors"
                      >
                        {service.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <NavLink href={siteConfig.keyPages.portfolio} label="Portfolio" />
              <NavLink href="/" label="Blog" isActive />
              <NavLink href={siteConfig.keyPages.contact} label="Contact" />

              <a
                href={siteConfig.keyPages.contact}
                className="ml-4 btn-primary text-sm"
              >
                Get a Quote
              </a>
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-brand-dark"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-2">
              <MobileLink href={siteConfig.mainSiteUrl} label="Home" />
              <MobileLink href={siteConfig.keyPages.about} label="About Us" />
              <MobileLink href={servicesWithUrls[0].url} label="Services" />
              {servicesWithUrls.map((service) => (
                <a
                  key={service.url}
                  href={service.url}
                  className="block pl-6 py-2 text-sm text-brand-text-secondary hover:text-brand-accent"
                >
                  {service.name}
                </a>
              ))}
              <MobileLink href={siteConfig.keyPages.portfolio} label="Portfolio" />
              <MobileLink href="/" label="Blog" isActive />
              <MobileLink href={siteConfig.keyPages.contact} label="Contact" />
              <a
                href={siteConfig.keyPages.contact}
                className="block mt-4 btn-primary text-center text-sm"
              >
                Get a Quote
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function NavLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  const isExternal = href.startsWith("http");
  const className = `px-3 py-2 font-medium transition-colors ${
    isActive
      ? "text-brand-accent"
      : "text-brand-text-secondary hover:text-brand-accent"
  }`;

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  const className = `block py-2 font-medium ${
    isActive ? "text-brand-accent" : "text-brand-text-secondary"
  }`;
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
