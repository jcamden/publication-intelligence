import type { Preview } from "@storybook/nextjs-vite";
import { Provider as JotaiProvider } from "jotai";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import { MockProjectProvider } from "../src/app/_common/_test-utils/storybook-utils/project-decorator";
import { MockThemeProvider } from "../src/app/_common/_test-utils/storybook-utils/theme-decorator";
import { TrpcDecorator } from "../src/app/_common/_test-utils/storybook-utils/trpc-decorator";
import "../src/app/globals.css";

// Mock Next.js navigation hooks for Storybook
if (typeof window !== "undefined") {
	// @ts-expect-error - Mocking Next.js internals for Storybook
	window.next = window.next || {};
	// @ts-expect-error - Mocking Next.js router
	window.next.router = {
		push: (href: string) => console.log("[Mock Router] push:", href),
		replace: (href: string) => console.log("[Mock Router] replace:", href),
		refresh: () => console.log("[Mock Router] refresh"),
		back: () => console.log("[Mock Router] back"),
		forward: () => console.log("[Mock Router] forward"),
		prefetch: (href: string) => console.log("[Mock Router] prefetch:", href),
		pathname: "/",
		query: {},
		asPath: "/",
	};
}

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		viewport: {
			options: {
				...MINIMAL_VIEWPORTS,
				mobile1: {
					name: "mobile1 (375×667)",
					styles: { width: "375px", height: "667px" },
					type: "mobile",
				},
				tablet: {
					name: "tablet (768×1024)",
					styles: { width: "768px", height: "1024px" },
					type: "tablet",
				},
			},
		},
		backgrounds: {
			default: "light",
			values: [
				{ name: "light", value: "#ffffff" },
				{ name: "dark", value: "#0a0a0a" },
			],
		},
		a11y: {
			config: {
				rules: [
					{
						id: "color-contrast",
						enabled: true,
					},
				],
			},

			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/",
				query: {},
			},
		},
	},
	tags: ["autodocs"],
	globalTypes: {
		theme: {
			description: "Global theme for components",
			defaultValue: "light",
			toolbar: {
				title: "Theme",
				icon: "circlehollow",
				items: ["light", "dark"],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: {
		theme: "light",
	},
	decorators: [
		// Global tRPC provider, theme provider, and project provider for all stories
		(Story, context) => {
			const theme = context.globals.theme || "light";

			// Set theme on document element so portals inherit it
			if (typeof document !== "undefined") {
				document.documentElement.setAttribute("data-theme", theme);
				// Apply .dark class for CSS
				if (theme === "dark") {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
			}

			return (
				<JotaiProvider>
					<TrpcDecorator>
						<MockThemeProvider theme={theme as "light" | "dark"}>
							<MockProjectProvider projectId="test-project-id">
								<Story />
							</MockProjectProvider>
						</MockThemeProvider>
					</TrpcDecorator>
				</JotaiProvider>
			);
		},
	],
};

export default preview;
