import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client"],
  // The Docker image sets NEXT_OUTPUT=standalone to ship a self-contained server
  // (see Dockerfile); `npm start` keeps using the regular build.
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),
};

export default nextConfig;
