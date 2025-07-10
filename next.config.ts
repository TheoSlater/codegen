import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for WebContainer API and SharedArrayBuffer support
  serverExternalPackages: ['@webcontainer/api'],

  async headers() {
    return [
      {
        source: "/(.*)", // apply to all routes
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
