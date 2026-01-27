export const typography = {
	fontFamily: {
		sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
		mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
	},
	fontSize: {
		xs: ["0.75rem", { lineHeight: "1rem" }],
		sm: ["0.875rem", { lineHeight: "1.25rem" }],
		base: ["1rem", { lineHeight: "1.5rem" }],
		lg: ["1.125rem", { lineHeight: "1.75rem" }],
		xl: ["1.25rem", { lineHeight: "1.75rem" }],
		"2xl": ["1.5rem", { lineHeight: "2rem" }],
		"3xl": ["1.875rem", { lineHeight: "2.25rem" }],
		"4xl": ["2.25rem", { lineHeight: "2.5rem" }],
		"5xl": ["3rem", { lineHeight: "1" }],
		"6xl": ["3.75rem", { lineHeight: "1" }],
	},
	fontWeight: {
		light: "300",
		normal: "400",
		medium: "500",
		semibold: "600",
		bold: "700",
		extrabold: "800",
	},
} as const;
