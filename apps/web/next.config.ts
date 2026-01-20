import type { NextConfig } from "next";

// API backend URL for server-side rewrites (runtime configurable)
// This is a server-side env var, NOT baked into the client bundle
const API_BACKEND_URL = process.env.API_BACKEND_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  
  // Rewrite /api/* requests to the backend API
  // This allows the frontend to use relative URLs (/api/v1/...)
  // which get proxied to the actual backend at runtime
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BACKEND_URL}/api/:path*`,
      },
      // Also proxy uploads endpoint
      {
        source: '/uploads/:path*',
        destination: `${API_BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
