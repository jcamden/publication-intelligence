import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { DeleteMentionDialog } from "../../delete-mention-dialog";

const meta = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/DeleteMentionDialog/tests/Visual Regression Tests",
	component: DeleteMentionDialog,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof DeleteMentionDialog>;

export default meta;
type Story = StoryObj<typeof DeleteMentionDialog>;

export const Default: Story = {
	args: {
		isOpen: true,
		onOpenChange: () => {},
		onConfirm: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));
	},
};

export const DefaultDark: Story = {
	args: {
		isOpen: true,
		onOpenChange: () => {},
		onConfirm: () => {},
	},
	globals: {
		theme: "dark",
		backgrounds: { value: "dark" },
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));
	},
};
