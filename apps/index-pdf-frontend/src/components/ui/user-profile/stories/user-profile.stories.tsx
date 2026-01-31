import type { Meta, StoryObj } from "@storybook/react";
import { UserProfile } from "../user-profile";

const meta: Meta<typeof UserProfile> = {
	title: "Components/UserProfile",
	component: UserProfile,
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: "TODO: Add component description",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	// TODO: Add story implementation
};
