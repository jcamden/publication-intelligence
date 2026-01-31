import type { Meta, StoryObj } from "@storybook/react";
import { ProjectNavbar } from "../../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Components/ProjectNavbar/tests/Interaction Tests",
	component: ProjectNavbar,
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	// TODO: Add interaction test implementation
};
