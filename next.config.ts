import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  images: {
    // Admins can attach images from arbitrary hosts (their own CDN, image hosts,
    // etc.) as well as local uploads served from /public/uploads. Restricting
    // remotePatterns to a tiny whitelist meant any other host was blocked by the
    // Next.js image optimizer, so category/product/banner images saved with an
    // external URL showed in the dashboard (<img>) but not on the storefront
    // (<Image>). Allow every http(s) host; local /uploads paths are always allowed.
    remotePatterns: [
      { protocol: 'https', hostname: '**', port: '', pathname: '/**' },
      { protocol: 'http', hostname: '**', port: '', pathname: '/**' },
    ],
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
};

export default nextConfig;
