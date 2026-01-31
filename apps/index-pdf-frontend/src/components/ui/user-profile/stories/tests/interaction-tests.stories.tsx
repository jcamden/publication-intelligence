import type { Meta, StoryObj } from "@storybook/react";
import { UserProfile } from "../../user-profile";

const meta: Meta<typeof UserProfile> = {
	title: "Components/UserProfile/tests/Interaction Tests",
	component: UserProfile,
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	// TODO: Add interaction test implementation
};
