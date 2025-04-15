import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://185.94.99.35:5000/api/:path*', // پروکسی به سرور Express
      },
    ];
  },
};

export default nextConfig;
