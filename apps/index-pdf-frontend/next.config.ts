import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@pubint/core",
		"@pubint/pdf",
		"@pubint/llm",
		"@pubint/yabasic",
		"@pubint/yaboujee",
	],
	webpack: (config) => {
		// Fix for PDF.js worker issues with Next.js
		config.resolve.alias = {
			...config.resolve.alias,
			canvas: false,
		};

		// Exclude pdfjs-dist from being parsed as ESM when it has issues
		config.module = {
			...config.module,
			exprContextCritical: false,
		};

		return config;
	},
};

export default nextConfig;
