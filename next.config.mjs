/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polymarket-upload.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'gamma-api.polymarket.com',
      },
    ],
  },

  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
};

export default nextConfig;
