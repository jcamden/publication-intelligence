import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectNavbar } from "../../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Projects/ProjectNavbar/tests/Visual Regression Tests",
	component: ProjectNavbar,
	parameters: {
		...visualRegressionTestConfig,
		layout: "fullscreen",
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects",
			},
		},
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Navbar in light mode
 */
export const LightMode: Story = {
	globals: {
		...defaultGlobals,
	},
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
};

/**
 * Navbar in dark mode
 */
export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "dark",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
};
