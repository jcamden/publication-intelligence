import type { Meta, StoryObj } from "@storybook/react";
import { DeleteMentionDialog } from "../delete-mention-dialog";

const meta = {
	title: "Projects/[ProjectDir]/Editor/DeleteMentionDialog",
	component: DeleteMentionDialog,
	parameters: {
		layout: "centered",
	},
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
} satisfies Meta<typeof DeleteMentionDialog>;

export default meta;
type Story = StoryObj<typeof DeleteMentionDialog>;

export const Default: Story = {};

export const Closed: Story = {
	args: {
		isOpen: false,
	},
};
