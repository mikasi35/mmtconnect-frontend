/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  },
  // ESLint is not a build dependency here; run `npm run lint` separately.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
