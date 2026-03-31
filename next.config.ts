import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["blog.outdoorreno.com", "outdoorreno.com"],
  },
};

export default nextConfig;
