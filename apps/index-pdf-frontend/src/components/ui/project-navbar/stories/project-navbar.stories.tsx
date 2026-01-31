import type { Meta, StoryObj } from "@storybook/react";
import { ProjectNavbar } from "../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	title: "Components/ProjectNavbar",
	component: ProjectNavbar,
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
