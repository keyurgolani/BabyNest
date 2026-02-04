import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Runtime API Proxying
 * 
 * This middleware proxies /api/* and /uploads/* requests to the backend API.
 * Unlike next.config.ts rewrites (which are evaluated at build time),
 * middleware runs at runtime and can read environment variables dynamically.
 * 
 * This is essential for Docker deployments where API_BACKEND_URL is set
 * at container runtime, not during image build.
 * 
 * The approach supports:
 * - Flexible port mapping (users can map container ports to any host port)
 * - Reverse proxy/tunneling (Cloudflare Tunnel, ngrok, Tailscale, etc.)
 * - Self-hosting scenarios with custom network configurations
 */

// Read backend URL at runtime (not build time!)
function getBackendUrl(): string {
  return process.env.API_BACKEND_URL || 'http://localhost:3000';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /api/* requests to the backend
  if (pathname.startsWith('/api/')) {
    const backendUrl = getBackendUrl();
    const targetUrl = new URL(pathname + request.nextUrl.search, backendUrl);
    
    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: request.headers,
      },
    });
  }

  // Proxy /uploads/* requests to the backend
  if (pathname.startsWith('/uploads/')) {
    const backendUrl = getBackendUrl();
    const targetUrl = new URL(pathname + request.nextUrl.search, backendUrl);
    
    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: request.headers,
      },
    });
  }

  return NextResponse.next();
}

// Only run middleware on these paths (performance optimization)
export const config = {
  matcher: ['/api/:path*', '/uploads/:path*'],
};
