/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' }
    ]
  },
  // Alias bonito: /mis-logs/* → /api/proxy/* (proxy real con stripping de X-Frame).
  async rewrites() {
    return [
      { source: '/mis-logs',           destination: '/api/proxy' },
      { source: '/mis-logs/:path*',    destination: '/api/proxy/:path*' }
    ];
  }
};

export default nextConfig;
