const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true, // CRITICAL: This creates /seeker/dashboard/index.html
};

module.exports = nextConfig;
