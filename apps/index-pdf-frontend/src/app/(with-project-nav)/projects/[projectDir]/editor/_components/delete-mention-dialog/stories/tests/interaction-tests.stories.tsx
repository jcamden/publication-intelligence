import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { DeleteMentionDialog } from "../../delete-mention-dialog";
import {
	clickCancelInDialog,
	clickDeleteInDialog,
	expectDeleteMentionDialogContent,
	waitForDeleteMentionDialog,
} from "../helpers/steps";

const meta = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/DeleteMentionDialog/tests/Interaction Tests",
	component: DeleteMentionDialog,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof DeleteMentionDialog>;

export default meta;
type Story = StoryObj<typeof DeleteMentionDialog>;

export const ConfirmDelete: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		await waitForDeleteMentionDialog({ step });
		await clickDeleteInDialog({ step });
	},
};

export const CancelDelete: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		await waitForDeleteMentionDialog({ step });
		await clickCancelInDialog({ step });
	},
};

export const VerifyContent: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		await expectDeleteMentionDialogContent({ step });
	},
};
