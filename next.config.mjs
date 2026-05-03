/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/mis-logs/:path*',
        destination: 'https://logs.fivemonitor.com/:path*',
      },
    ];
  }
};

export default nextConfig;
