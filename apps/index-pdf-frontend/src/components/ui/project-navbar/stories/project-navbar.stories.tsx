import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { TrpcDecorator } from "../../storybook-utils/trpc-decorator";
import { ProjectNavbar } from "../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Components/ProjectNavbar",
	component: ProjectNavbar,
	decorators: [
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
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

export const WithoutUser: Story = {
	args: {
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
};

export const DarkTheme: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "dark",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
};
