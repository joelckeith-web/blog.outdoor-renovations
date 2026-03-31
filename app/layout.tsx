import type { Metadata } from "next";
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
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.blogUrl,
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
      </head>
      <body className="min-h-screen flex flex-col font-body antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
