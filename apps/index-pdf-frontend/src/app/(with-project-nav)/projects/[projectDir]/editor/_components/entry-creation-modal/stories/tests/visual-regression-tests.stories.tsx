import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import { EntryCreationModal } from "../../entry-creation-modal";
import { vrtFillLabelAndSelectPhilosophyParent } from "../helpers/steps";

const meta: Meta<typeof EntryCreationModal> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/EntryCreationModal/tests/Visual Regression Tests",
	component: EntryCreationModal,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * VRT: With parent selected
 */
export const WithParentSelected: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		await vrtFillLabelAndSelectPhilosophyParent({ step });
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
};
