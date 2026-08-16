import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev https://*.r2.cloudflarestorage.com https://*.googleusercontent.com https://*.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://aws-0-ap-south-1.pooler.supabase.com https://*.r2.cloudflarestorage.com https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
