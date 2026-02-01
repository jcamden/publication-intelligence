import type { Meta, StoryObj } from "@storybook/react";
import { PageBar } from "../page-bar";

const meta: Meta<typeof PageBar> = {
	title: "Projects/[ProjectDir]/Editor/PageBar",
	component: PageBar,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Controls which panels are visible in the page sidebar (right side). Shows toggle buttons for: Info, Contexts, Bibliography, Authors, Scripture, Subject. Note: This component requires Jotai Provider to function.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <PageBar />,
};
