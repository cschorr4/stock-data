/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    serverComponentsExternalPackages: ['yfinance']
  },
  // Add these configurations
  distDir: '.next',
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig