/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    serverComponentsExternalPackages: ['yfinance']
  },
  output: 'standalone',  // Add this
}

export default nextConfig