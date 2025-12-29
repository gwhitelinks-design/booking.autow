/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['autow-services.co.uk'],
  },
  // Disable static optimization for pages with dynamic content
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
