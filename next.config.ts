import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The isolated preview shares installed dependencies with the original workspace.
  ...(process.env.LOCAL_TIMING_PREVIEW === "1" ? { turbopack: { root: path.resolve(process.cwd(), "..") } } : {}),
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
  async headers() {
    return [{
      source: "/cad-demo/occt-0.0.23/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
};

export default nextConfig;
