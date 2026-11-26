/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;

