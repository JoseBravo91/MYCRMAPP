/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Next.js inyecta scripts inline para la hidratación, por eso 'unsafe-inline' es necesario
// sin una estrategia de nonces. 'unsafe-eval' solo se habilita en desarrollo (Fast Refresh).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Evita que Next.js genere AGENTS.md en la raíz del proyecto
  agentRules: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Las imágenes subidas se sirven aisladas: nunca pueden ejecutar scripts
      { source: '/api/assets/:id', headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" }] },
    ];
  },
};

module.exports = nextConfig;
