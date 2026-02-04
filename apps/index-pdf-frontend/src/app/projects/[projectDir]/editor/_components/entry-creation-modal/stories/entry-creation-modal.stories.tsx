import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { mockSubjectEntries } from "../../../_mocks/index-entries";
import { EntryCreationModal } from "../entry-creation-modal";

const meta: Meta<typeof EntryCreationModal> = {
	title: "Projects/[ProjectDir]/Editor/EntryCreationModal",
	component: EntryCreationModal,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default entry creation modal for Subject index
 */
export const Default: Story = {
	args: {
		open: true,
		onClose: fn(),
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => {
			console.log("Created entry:", entry);
			return { ...entry, id: crypto.randomUUID() };
		},
	},
};

/**
 * Modal with pre-filled label (from quick create)
 */
export const WithPrefillLabel: Story = {
	args: {
		...Default.args,
		prefillLabel: "New Philosophy Entry",
	},
};

/**
 * Empty state (no existing entries for parents)
 */
export const EmptyState: Story = {
	args: {
		...Default.args,
		existingEntries: [],
	},
};
