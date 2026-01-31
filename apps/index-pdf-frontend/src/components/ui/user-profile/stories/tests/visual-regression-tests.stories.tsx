import type { Meta, StoryObj } from "@storybook/react";
import { UserProfile } from "../../user-profile";

const meta: Meta<typeof UserProfile> = {
	title: "Components/UserProfile/tests/Visual Regression Tests",
	component: UserProfile,
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	// TODO: Add visual regression test implementation
};
