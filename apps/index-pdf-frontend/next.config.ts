import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@pubint/core",
		"@pubint/pdf",
		"@pubint/llm",
		"@pubint/yabasic",
		"@pubint/yaboujee",
	],
};

export default nextConfig;
