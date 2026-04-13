/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["dev.netkrida.cloud"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.API_BASE_URL}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
