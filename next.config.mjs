/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    serverComponentsExternalPackages: ['yfinance']
  }
}

export default nextConfig;