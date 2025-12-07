/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 注释掉以支持 API 路由
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
