import type { Meta, StoryObj } from "@storybook/react";
import { ProjectNavbar } from "../../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Components/ProjectNavbar/tests/Visual Regression Tests",
	component: ProjectNavbar,
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	// TODO: Add visual regression test implementation
};
