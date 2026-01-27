import type { Config } from "tailwindcss";
import { colors, radius, shadows, spacing, typography } from "./src/tokens";

const config: Config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					light: `hsl(${colors.primary.light})`,
					DEFAULT: `hsl(${colors.primary.DEFAULT})`,
					dark: `hsl(${colors.primary.dark})`,
				},
				secondary: {
					light: `hsl(${colors.secondary.light})`,
					DEFAULT: `hsl(${colors.secondary.DEFAULT})`,
					dark: `hsl(${colors.secondary.dark})`,
				},
				accent: {
					light: `hsl(${colors.accent.light})`,
					DEFAULT: `hsl(${colors.accent.DEFAULT})`,
					dark: `hsl(${colors.accent.dark})`,
				},
				success: {
					light: `hsl(${colors.success.light})`,
					DEFAULT: `hsl(${colors.success.DEFAULT})`,
					dark: `hsl(${colors.success.dark})`,
				},
				warning: {
					light: `hsl(${colors.warning.light})`,
					DEFAULT: `hsl(${colors.warning.DEFAULT})`,
					dark: `hsl(${colors.warning.dark})`,
				},
				error: {
					light: `hsl(${colors.error.light})`,
					DEFAULT: `hsl(${colors.error.DEFAULT})`,
					dark: `hsl(${colors.error.dark})`,
				},
				info: {
					light: `hsl(${colors.info.light})`,
					DEFAULT: `hsl(${colors.info.DEFAULT})`,
					dark: `hsl(${colors.info.dark})`,
				},
				neutral: {
					50: `hsl(${colors.neutral[50]})`,
					100: `hsl(${colors.neutral[100]})`,
					200: `hsl(${colors.neutral[200]})`,
					300: `hsl(${colors.neutral[300]})`,
					400: `hsl(${colors.neutral[400]})`,
					500: `hsl(${colors.neutral[500]})`,
					600: `hsl(${colors.neutral[600]})`,
					700: `hsl(${colors.neutral[700]})`,
					800: `hsl(${colors.neutral[800]})`,
					900: `hsl(${colors.neutral[900]})`,
					950: `hsl(${colors.neutral[950]})`,
				},
				background: "hsl(var(--color-background))",
				surface: "hsl(var(--color-surface))",
				"surface-hover": "hsl(var(--color-surface-hover))",
				border: "hsl(var(--color-border))",
				text: "hsl(var(--color-text))",
				"text-secondary": "hsl(var(--color-text-secondary))",
			},
			spacing,
			borderRadius: radius,
			fontFamily: typography.fontFamily,
			fontSize: typography.fontSize,
			fontWeight: typography.fontWeight,
			boxShadow: shadows,
		},
	},
	plugins: [],
};

export default config;
