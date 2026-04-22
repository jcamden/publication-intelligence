import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mockSubjectEntries } from "../../../../_mocks/mock-index-entries";
import { EntryCreationModal } from "../../entry-creation-modal";
import {
	allowSameLabelUnderDifferentParent,
	cancelClosesModal,
	createEntryWithParent,
	createTopLevelEntry,
	validateUniqueLabelUnderSameParent,
} from "../helpers/steps";

const meta: Meta<typeof EntryCreationModal> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/EntryCreationModal/tests/Interaction Tests",
	component: EntryCreationModal,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateTopLevelEntry: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		await createTopLevelEntry({ step });
	},
};

export const ValidateUniqueLabelUnderSameParent: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		await validateUniqueLabelUnderSameParent({ step });
	},
};

export const AllowSameLabelUnderDifferentParent: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
		prefillLabel: "Kant, Immanuel",
	},
	play: async ({ step }) => {
		await allowSameLabelUnderDifferentParent({ step });
	},
};

export const CreateEntryWithParent: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		await createEntryWithParent({ step });
	},
};

export const CancelClosesModal: Story = {
	args: {
		open: true,
		onClose: () => console.log("Modal closed"),
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		await cancelClosesModal({ step });
	},
};
