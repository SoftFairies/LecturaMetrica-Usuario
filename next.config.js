
const EXTERNAL_API = process.env.NEXT_PUBLIC_API_URL || "https://users-production-2f97.up.railway.app";

/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${EXTERNAL_API}/api/:path*`,
      },
    ];
  },
};
