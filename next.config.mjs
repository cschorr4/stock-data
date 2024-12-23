/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: "loose"  // Add this line
  }
}

export default nextConfig;