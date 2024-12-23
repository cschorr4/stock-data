/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next',  // Add this line
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    serverComponentsExternalPackages: ['yfinance']
  }
}

export default nextConfig