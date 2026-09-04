import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy for DiaBem.
 *
 * The policy is applied as an HTTP header (defense-in-depth alongside the
 * client-side crypto layer). Next.js injects inline scripts/styles for hydration
 * and streaming, so `script-src`/`style-src` require `'unsafe-inline'`.
 * `'unsafe-eval'` is only needed in development (Turbopack/webpack HMR); the
 * production build works without it (verified by build + browser smoke test).
 * User health data is never rendered through `dangerouslySetInnerHTML`; the
 * policy is one of several XSS layers (escaping + sanitization + CSP).
 *
 * Documented trade-off: removing `'unsafe-inline'` requires a nonce-based
 * middleware approach and is future hardening, not current drift.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isProduction ? "" : "'unsafe-eval'"}`.trimEnd(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${isProduction ? "" : "ws: http://localhost:*"}`.trimEnd(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=self, microphone=self, geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;