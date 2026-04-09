/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Next.js static generation throws timeouts to disconnected NeonDB databases during headless builds
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig
