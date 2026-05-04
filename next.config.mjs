/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@mlc-ai/web-llm'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' }
    ]
  },
  async rewrites() {
    return [
      { source: '/mis-logs',           destination: '/api/proxy' },
      { source: '/mis-logs/:path*',    destination: '/api/proxy/:path*' }
    ];
  }
};

export default nextConfig;
