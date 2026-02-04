import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import { EntryCreationModal } from "../../entry-creation-modal";

const meta: Meta<typeof EntryCreationModal> = {
	title:
		"Projects/[ProjectDir]/Editor/EntryCreationModal/tests/Interaction Tests",
	component: EntryCreationModal,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test: Create top-level entry
 */
export const CreateTopLevelEntry: Story = {
	args: {
		open: true,
		onClose: () => {},
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => {
			console.log("Created:", entry);
			return { ...entry, id: crypto.randomUUID() };
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Fill label field", async () => {
			const labelInput = body.getByLabelText("Label");
			await userEvent.type(labelInput, "New Entry");
		});

		await step("Click create button", async () => {
			const createButton = body.getByRole("button", { name: "Create" });
			await userEvent.click(createButton);
		});
	},
};

/**
 * Test: Validate unique label
 */
export const ValidateUniqueLabel: Story = {
	args: {
		open: true,
		onClose: () => {},
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => {
			return { ...entry, id: crypto.randomUUID() };
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Wait for modal to be fully rendered", async () => {
			await waitFor(
				() => {
					const modal = body.getByRole("dialog", { hidden: true });
					expect(modal).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);

			// Extra time for modal to initialize in headless mode
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Enter existing label", async () => {
			const labelInput = body.getByLabelText("Label");
			await userEvent.type(labelInput, "Philosophy");
		});

		await step("Submit form and verify error appears", async () => {
			const createButton = body.getByRole("button", { name: "Create" });
			await userEvent.click(createButton);

			await waitFor(
				async () => {
					const alert = body.getByRole("alert");
					await expect(alert).toHaveTextContent(
						/already exists in this index/i,
					);
				},
				{ timeout: 5000, interval: 50 },
			);
		});
	},
};

/**
 * Test: Create entry with parent
 */
export const CreateEntryWithParent: Story = {
	args: {
		open: true,
		onClose: () => {},
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => {
			console.log("Created with parent:", entry);
			return { ...entry, id: crypto.randomUUID() };
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Fill label field", async () => {
			const labelInput = body.getByLabelText("Label");
			await userEvent.type(labelInput, "Epistemology");
		});

		await step("Select parent entry", async () => {
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
		});

		await step("Fill aliases field", async () => {
			const aliasesInput = body.getByLabelText(/Aliases/i);
			await userEvent.type(aliasesInput, "Theory of Knowledge");
		});

		await step("Submit form", async () => {
			const createButton = body.getByRole("button", { name: "Create" });
			await userEvent.click(createButton);
		});
	},
};

/**
 * Test: Cancel closes modal without creating
 */
export const CancelClosesModal: Story = {
	args: {
		open: true,
		onClose: () => console.log("Modal closed"),
		indexType: "subject",
		existingEntries: mockSubjectEntries,
		onCreate: (entry) => {
			console.log("This should not be called");
			return { ...entry, id: crypto.randomUUID() };
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Fill some data", async () => {
			const labelInput = body.getByLabelText("Label");
			await userEvent.type(labelInput, "Test Entry");
		});

		await step("Click cancel button", async () => {
			const cancelButton = body.getByRole("button", { name: "Cancel" });
			await userEvent.click(cancelButton);
		});
	},
};
