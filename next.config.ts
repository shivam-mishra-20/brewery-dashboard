import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
      'webstring-media.firebasestorage.app',
    ],
  },
}

export default nextConfig
