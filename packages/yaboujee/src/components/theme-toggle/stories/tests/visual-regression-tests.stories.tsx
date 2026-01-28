import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { Theme } from "../../theme-toggle";
import { ThemeToggle } from "../../theme-toggle";

export default {
	title: "Components/ThemeToggle/tests/Visual Regression Tests",
	component: ThemeToggle,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
	},
} satisfies Meta<typeof ThemeToggle>;

export const LightMode: StoryObj<typeof ThemeToggle> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");

		return (
			<div style={{ padding: "16px" }}>
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				/>
			</div>
		);
	},
};

export const DarkMode: StoryObj<typeof ThemeToggle> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
		theme: "dark",
	},
	render: () => {
		const [theme, setTheme] = useState<Theme>("dark");

		return (
			<div style={{ padding: "16px" }}>
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				/>
			</div>
		);
	},
};
