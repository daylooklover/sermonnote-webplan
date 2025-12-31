/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true, // 🚨 정적 배포 시 스타일 경로 인식을 위한 필수 설정
};
module.exports = nextConfig;