import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('https://static.seekingalpha.com/cdn/s3/uploads/**')],
  },
};

export default nextConfig;
