/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
    // skip build errors since we want to run without db
=======
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
>>>>>>> main
}

module.exports = nextConfig
