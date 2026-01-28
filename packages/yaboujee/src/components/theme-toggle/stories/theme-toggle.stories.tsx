import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";

const meta = {
	component: ThemeToggle,
	title: "Components/ThemeToggle",
	parameters: {
		docs: {
			description: {
				component: `A toggle button for switching between light and dark themes.

## Features
- Icon-based toggle (Sun/Moon)
- Accessible with aria-label
- Controlled component pattern
- Works with any theme provider

## Usage
Pass the current theme and an onToggle callback. The component is controlled, so you manage the theme state.`,
			},
		},
	},
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		theme: "light",
		onToggle: () => {},
	},
	render: () => {
		const [theme, setTheme] = useState<"light" | "dark">("light");

		return (
			<ThemeToggle
				theme={theme}
				onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
			/>
		);
	},
};

export const WithCustomClassName: Story = {
	args: {
		theme: "light",
		onToggle: () => {},
	},
	render: () => {
		const [theme, setTheme] = useState<"light" | "dark">("light");

		return (
			<ThemeToggle
				theme={theme}
				onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				className="border-2 border-primary"
			/>
		);
	},
};
