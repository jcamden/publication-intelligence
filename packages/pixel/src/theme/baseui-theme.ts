import { colors, radius, shadows, spacing, typography } from "../tokens";

export const baseuiTheme = {
	colors: {
		primary: `hsl(${colors.primary.DEFAULT})`,
		primaryLight: `hsl(${colors.primary.light})`,
		primaryDark: `hsl(${colors.primary.dark})`,

		secondary: `hsl(${colors.secondary.DEFAULT})`,
		secondaryLight: `hsl(${colors.secondary.light})`,
		secondaryDark: `hsl(${colors.secondary.dark})`,

		accent: `hsl(${colors.accent.DEFAULT})`,
		accentLight: `hsl(${colors.accent.light})`,
		accentDark: `hsl(${colors.accent.dark})`,

		success: `hsl(${colors.success.DEFAULT})`,
		successLight: `hsl(${colors.success.light})`,
		successDark: `hsl(${colors.success.dark})`,

		warning: `hsl(${colors.warning.DEFAULT})`,
		warningLight: `hsl(${colors.warning.light})`,
		warningDark: `hsl(${colors.warning.dark})`,

		error: `hsl(${colors.error.DEFAULT})`,
		errorLight: `hsl(${colors.error.light})`,
		errorDark: `hsl(${colors.error.dark})`,

		info: `hsl(${colors.info.DEFAULT})`,
		infoLight: `hsl(${colors.info.light})`,
		infoDark: `hsl(${colors.info.dark})`,

		neutral50: `hsl(${colors.neutral[50]})`,
		neutral100: `hsl(${colors.neutral[100]})`,
		neutral200: `hsl(${colors.neutral[200]})`,
		neutral300: `hsl(${colors.neutral[300]})`,
		neutral400: `hsl(${colors.neutral[400]})`,
		neutral500: `hsl(${colors.neutral[500]})`,
		neutral600: `hsl(${colors.neutral[600]})`,
		neutral700: `hsl(${colors.neutral[700]})`,
		neutral800: `hsl(${colors.neutral[800]})`,
		neutral900: `hsl(${colors.neutral[900]})`,
		neutral950: `hsl(${colors.neutral[950]})`,

		background: "hsl(var(--color-background))",
		surface: "hsl(var(--color-surface))",
		surfaceHover: "hsl(var(--color-surface-hover))",
		border: "hsl(var(--color-border))",
		text: "hsl(var(--color-text))",
		textSecondary: "hsl(var(--color-text-secondary))",
	},
	spacing,
	radius,
	typography,
	shadows,
} as const;

export type BaseuiTheme = typeof baseuiTheme;
