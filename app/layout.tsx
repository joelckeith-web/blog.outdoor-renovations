import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Poppins } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LocalBusinessSchema, WebSiteSchema } from "@/components/SchemaMarkup";
import { siteConfig } from "@/lib/site-config";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `Blog | ${siteConfig.companyName}`,
    template: `%s | ${siteConfig.companyName} Blog`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.blogUrl),
  alternates: {
    // basePath is NOT applied to metadata URLs — spell out /blog
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${siteConfig.blogUrl}/blog`,
    siteName: `${siteConfig.companyName} Blog`,
    title: `Blog | ${siteConfig.companyName}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <head>
        <LocalBusinessSchema />
        <WebSiteSchema />
        {/* Google Tag Manager — same container as the main site
            (GTM-MDJPG8DX, loads GA4 G-9Y0MZF27Q3). Added 2026-07-16 when
            the blog moved under www.outdoorreno.com/blog so blog traffic
            lands in the main GA4 property. */}
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MDJPG8DX');`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-body antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MDJPG8DX"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
