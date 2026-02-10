import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { DeleteEntryDialog } from "../delete-entry-dialog";

const meta = {
	title: "Projects/[ProjectDir]/Editor/DeleteEntryDialog",
	component: DeleteEntryDialog,
	parameters: {
		layout: "centered",
	},
	args: {
		open: true,
		onOpenChange: fn(),
	},
} satisfies Meta<typeof DeleteEntryDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		entry: {
			id: "entry-1",
			indexType: "subject",
			label: "Kant, Immanuel",
			parentId: null,
			projectId: "project-1",
			projectIndexTypeId: "pit-1",
		},
	},
};

export const NestedEntry: Story = {
	args: {
		entry: {
			id: "entry-2",
			indexType: "subject",
			label: "Critique of Pure Reason",
			parentId: "entry-1",
			projectId: "project-1",
			projectIndexTypeId: "pit-1",
		},
	},
};

export const LongLabel: Story = {
	args: {
		entry: {
			id: "entry-3",
			indexType: "author",
			label:
				"This is a very long entry label that should wrap to multiple lines in the dialog",
			parentId: null,
			projectId: "project-1",
			projectIndexTypeId: "pit-1",
		},
	},
};
