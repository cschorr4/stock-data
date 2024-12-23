/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Add this line
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    serverComponentsExternalPackages: ['yfinance']
  }
}

export default nextConfig