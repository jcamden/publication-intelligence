import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectNavbar } from "../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Projects/ProjectNavbar",
	component: ProjectNavbar,
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component:
					"Navigation bar for project pages with user dropdown and theme toggle",
			},
		},
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
};
