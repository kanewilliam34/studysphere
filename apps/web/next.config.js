/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    NEXT_PUBLIC_NEXCONN_APP_KEY: process.env.NEXT_PUBLIC_NEXCONN_APP_KEY || "studysphere_app_key_placeholder",
  },
};

module.exports = nextConfig;
