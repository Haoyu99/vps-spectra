/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig