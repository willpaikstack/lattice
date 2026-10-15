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
  async headers() {
    return [{
      source: "/cad-demo/occt-0.0.23/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
};

export default nextConfig;
