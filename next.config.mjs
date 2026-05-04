/** @type {import('next').NextConfig} */

const THEME_SCRIPT_HASH = 'sha256-PZU1VWuKe7Knu2aNlgw3NaTM7B3UbyJBB2usTMMxd+A=';

const CSP = [
  "default-src 'self'",
  `script-src 'self' '${THEME_SCRIPT_HASH}'`,

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  "font-src 'self' https://fonts.gstatic.com",

  "img-src 'self' data: https://cdn.discordapp.com",

  "connect-src 'self' https://huggingface.co https://*.huggingface.co",

  "worker-src blob: 'self'",

  "frame-src 'self'",

  "object-src 'none'",

  "base-uri 'self'",

  "form-action 'self' https://discord.com/api/oauth2/authorize",

  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@mlc-ai/web-llm'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' }
    ]
  },
  async headers() {
    return [
      {

        source: '/((?!mis-logs|api/proxy).*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/mis-logs',           destination: '/api/proxy' },
      { source: '/mis-logs/:path*',    destination: '/api/proxy/:path*' }
    ];
  }
};

export default nextConfig;
