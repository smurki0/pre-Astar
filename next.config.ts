import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone is only for self-hosting (Docker/VPS). On Vercel the platform
  // provides its own adapter, so disable it there to avoid routing/size issues.
  output: process.env.VERCEL ? undefined : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Gzip/Brotli HTML+JSON responses. Saves bandwidth on Vercel free tier.
  compress: true,
  // Don't ship source maps to the browser in prod -> smaller function/output size.
  productionBrowserSourceMaps: false,
  // Tree-shake big barrel-import libs so only used icons/components ship.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      '@radix-ui/react-icons',
    ],
  },
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
