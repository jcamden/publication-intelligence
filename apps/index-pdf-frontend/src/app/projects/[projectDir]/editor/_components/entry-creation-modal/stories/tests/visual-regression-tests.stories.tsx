import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import { EntryCreationModal } from "../../entry-creation-modal";

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
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => ({ ...entry, id: "test" }),
	},
	play: async () => {
		const body = within(document.body);

		const labelInput = body.getByLabelText("Label");
		await userEvent.type(labelInput, "New Entry");

		const parentTrigger = body.getByRole("combobox", {
			name: /parent entry/i,
		});
		await userEvent.click(parentTrigger);

		await waitFor(async () => {
			// Get all options and find the exact "Philosophy" (not "Philosophy → X")
			const options = body.getAllByRole("option");
			const philosophyOption = options.find(
				(opt) => opt.textContent === "Philosophy",
			);
			if (!philosophyOption) {
				throw new Error("Philosophy option not found");
			}
			await userEvent.click(philosophyOption);
		});
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
};
