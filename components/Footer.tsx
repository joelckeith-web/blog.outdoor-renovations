import { siteConfig, servicesWithUrls, serviceAreaCities } from "@/lib/site-config";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {/* Main footer content — cream background to match brand */}
      <div className="bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About column with logo */}
            <div>
              <a href={siteConfig.mainSiteUrl} className="inline-block mb-4">
                <span className="font-heading font-extrabold text-xl text-brand-dark-secondary tracking-tight">
                  Outdoor Renovations
                </span>
              </a>
              <p className="text-brand-text-secondary text-sm leading-relaxed mb-4">
                Licensed Landscape Contractor serving Austin &amp; Central Texas
                since 2022. {siteConfig.reviews}.
              </p>
              <div className="flex space-x-4">
                {/* Facebook */}
                <a
                  href={siteConfig.social.facebook}
                  className="text-brand-text-secondary hover:text-brand-dark transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href={siteConfig.social.instagram}
                  className="text-brand-text-secondary hover:text-brand-dark transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* Google Maps */}
                <a
                  href={siteConfig.social.google}
                  className="text-brand-text-secondary hover:text-brand-dark transition-colors"
                  aria-label="Google Maps"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 6.38 8.5 15.5 8.5 15.5s8.5-9.12 8.5-15.5C20.5 3.81 16.69 0 12 0zm0 12.5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Services column */}
            <div>
              <h3 className="text-brand-dark font-bold text-lg mb-4">
                Our Services
              </h3>
              <ul className="space-y-2">
                {servicesWithUrls.map((service) => (
                  <li key={service.url}>
                    <a
                      href={service.url}
                      className="text-brand-text-secondary text-sm hover:text-brand-dark transition-colors"
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service areas column */}
            <div>
              <h3 className="text-brand-dark font-bold text-lg mb-4">
                Service Areas
              </h3>
              <ul className="space-y-2">
                {serviceAreaCities.map((area) => (
                  <li key={area.slug} className="text-brand-text-secondary text-sm">
                    {area.name}, TX
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column */}
            <div>
              <h3 className="text-brand-dark font-bold text-lg mb-4">
                Contact Us
              </h3>
              <div className="space-y-3 text-sm text-brand-text-secondary">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-dark mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {siteConfig.address.street}
                    <br />
                    {siteConfig.address.city}, {siteConfig.address.stateAbbr}{" "}
                    {siteConfig.address.zip}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-brand-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href={`tel:${siteConfig.phoneRaw}`}
                    className="hover:text-brand-dark transition-colors"
                  >
                    {siteConfig.phone}
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-brand-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="block">Mon-Fri: 7:00 AM - 6:00 PM</span>
                    <span className="block">Sat: 8:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>

              <a
                href={siteConfig.keyPages.contact}
                className="inline-block mt-4 bg-brand-dark text-white font-semibold px-6 py-3 rounded-md hover:bg-brand-dark-secondary transition-colors text-sm"
              >
                Get a Consultation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — dark green */}
      <div className="bg-brand-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-300">
          <p>
            &copy; {currentYear} {siteConfig.legalName}. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span>{siteConfig.license}</span>
            <a
              href={siteConfig.keyPages.contact}
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
            <a
              href={siteConfig.mainSiteUrl}
              className="hover:text-white transition-colors"
            >
              Main Site
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
