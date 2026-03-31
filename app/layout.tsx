import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LocalBusinessSchema, WebSiteSchema } from "@/components/SchemaMarkup";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: {
    default: `Blog | ${siteConfig.shortName}`,
    template: `%s | ${siteConfig.shortName} Blog`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.blogUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.blogUrl,
    siteName: `${siteConfig.shortName} Blog`,
    title: `Blog | ${siteConfig.shortName}`,
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
    <html lang="en">
      <head>
        <LocalBusinessSchema />
        <WebSiteSchema />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
