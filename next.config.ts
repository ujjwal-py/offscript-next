import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Opt the app into security-focused upgrade nudges for coding agents.
    agentUpgrade: "security",
  },
  images: {
    // Post images live in Supabase Storage (any project URL) or /public/uploads.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    // Explicit project root (a stray package-lock.json in a parent directory
    // would otherwise make Turbopack infer a much larger root).
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
