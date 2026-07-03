/** Next.js config: proxy /api requests to the real backend to avoid CORS
 *  This makes client-side calls to `/api/v1/...` be proxied server-side
 *  to the external API, so the browser doesn't hit cross-origin endpoints directly.
 */
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
