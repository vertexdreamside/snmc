/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sibert.sc',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
