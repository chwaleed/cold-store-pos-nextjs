/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'openweathermap.org',
      'pbs.twimg.com',
      'via.placeholder.com',
    ],
  },
  env: {
    WEATHER_API: process.env.WEATHER_API,
  },
  webpack(config) {
    // Add loader for .txt files
    config.module.rules.push({
      test: /\.txt$/i,
      use: 'raw-loader',
    });
    return config;
  },
};

export default nextConfig;
