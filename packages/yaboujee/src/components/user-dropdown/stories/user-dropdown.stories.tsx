import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { UserDropdown } from "../user-dropdown";

const meta = {
	title: "Components/UserDropdown",
	component: UserDropdown,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		userName: {
			control: "text",
			description: "User's display name",
		},
		userEmail: {
			control: "text",
			description: "User's email address",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
} satisfies Meta<typeof UserDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john.doe@example.com",
		onSettingsClick: fn(),
		onSignOutClick: fn(),
	},
};

export const WithoutEmail: Story = {
	args: {
		userName: "Jane Smith",
		onSettingsClick: fn(),
		onSignOutClick: fn(),
	},
};

export const LongName: Story = {
	args: {
		userName: "Christopher Alexander Montgomery",
		userEmail: "christopher.montgomery@verylongdomain.com",
		onSettingsClick: fn(),
		onSignOutClick: fn(),
	},
};
