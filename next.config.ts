import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
        pathname: "/wiki/Special:Redirect/file/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
  output: "standalone",
  outputFileTracingIncludes: { "/api/pdf-viewer-worker": ["./node_modules/pdfjs-dist/build/pdf.worker.min.mjs"] },
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
