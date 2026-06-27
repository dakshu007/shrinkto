import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root (multiple lockfiles exist on this machine).
  outputFileTracingRoot: __dirname,
  // jSquash codecs are WebAssembly modules loaded lazily in a Web Worker.
  // asyncWebAssembly lets webpack handle their dynamic `import()` of `.wasm`.
  webpack(config, { webpack }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // Some conversion libs (pptxgenjs, xlsx, docx) reference Node built-ins for
    // their server-side code paths we never call client-side. Stub them so the
    // browser bundle builds. Rewrite the `node:` scheme to bare specifiers first.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      https: false,
      http: false,
      url: false,
      zlib: false,
      stream: false,
      crypto: false,
      os: false,
    };
    return config;
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@jsquash/jpeg",
      "@jsquash/png",
      "@jsquash/webp",
      "@jsquash/avif",
      "@jsquash/oxipng",
      "@jsquash/resize",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
