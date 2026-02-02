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
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects",
			},
		},
	},
};

export const ProjectSpecificRoute: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects/my-book/editor",
			},
		},
		docs: {
			description: {
				story:
					"When on a project-specific route (/projects/[projectDir]/*), all navigation links are shown with dynamic hrefs based on the current project.",
			},
		},
	},
};

export const ShowOnlyProjectsLink: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
		showOnlyProjectsLink: true,
	},
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/settings",
			},
		},
		docs: {
			description: {
				story:
					"With showOnlyProjectsLink=true, only the Projects link is shown. Useful for settings or other non-project pages.",
			},
		},
	},
};
