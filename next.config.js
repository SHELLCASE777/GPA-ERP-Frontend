/** @type {import('next').NextConfig} */

// Derive allowed API origin from the baked-in env var so the CSP works on
// Railway (https://...) without hardcoding the LAN IP.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, ""); // strip trailing /api
// PWA Note: To enable full service-worker support, install `next-pwa` and wrap
// the config below with:
//
//   const withPWA = require('next-pwa')({
//     dest: 'public',
//     disable: process.env.NODE_ENV === 'development',
//     register: true,
//     skipWaiting: true,
//   });
//   module.exports = withPWA({ ...nextConfig });
//
// The manifest.json + meta tags in layout.tsx already provide basic PWA
// installability on Chrome/Edge/Safari without a service worker.

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev; tighten in prod
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      // connect-src: derived from NEXT_PUBLIC_API_URL so it works locally and on Railway
      `connect-src 'self' ws: wss: http://localhost:8002 ws://localhost:3000 ${API_ORIGIN}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  output: 'standalone',   // required for Docker multi-stage build
  images: { domains: [] },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
