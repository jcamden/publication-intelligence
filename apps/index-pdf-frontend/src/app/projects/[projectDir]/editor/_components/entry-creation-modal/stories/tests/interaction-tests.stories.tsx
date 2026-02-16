import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import { EntryCreationModal } from "../../entry-creation-modal";

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

/**
 * Test: Create top-level entry
 */
export const CreateTopLevelEntry: Story = {
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
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
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
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
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Fill label field", async () => {
			const labelInput = body.getByLabelText("Label");
			await userEvent.type(labelInput, "Epistemology");
		});

		await step("Select parent entry", async () => {
			// Find the parent entry combobox by its ID
			const parentInput = body.getByRole("combobox", {
				hidden: false,
			});
			await userEvent.click(parentInput);

			// Wait for options to appear
			await waitFor(
				async () => {
					const options = body.queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 2000 },
			);

			// Select "Philosophy" using native DOM click (userEvent.click doesn't work here)
			const options = body.getAllByRole("option");
			const philosophyOption = options.find(
				(opt) => opt.textContent === "Philosophy",
			);
			if (!philosophyOption) {
				throw new Error("Philosophy option not found");
			}

			// Force click using native DOM method
			(philosophyOption as HTMLElement).click();

			// Give it a moment to register the selection
			await new Promise((resolve) => setTimeout(resolve, 500));
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
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-subject-index-type-id",
		existingEntries: mockSubjectEntries,
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
