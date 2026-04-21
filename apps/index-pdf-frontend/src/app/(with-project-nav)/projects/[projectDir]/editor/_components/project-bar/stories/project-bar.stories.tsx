import type { Meta, StoryObj } from "@storybook/react";
import { ProjectBar } from "../project-bar";

const meta: Meta<typeof ProjectBar> = {
	title: "Projects/[ProjectDir]/Editor/ProjectBar",
	component: ProjectBar,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Controls which panels are visible in the project sidebar (left side). Shows toggle buttons for: Pages, Regions, Bibliography, Authors, Scripture, Subject. Note: This component requires Jotai Provider to function.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<ProjectBar enabledIndexTypes={["subject", "author", "scripture"]} />
	),
};
