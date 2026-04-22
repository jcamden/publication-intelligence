import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AddEntriesFromBooksModal } from "../../../add-entries-from-books-modal";

const meta: Meta<typeof AddEntriesFromBooksModal> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectScriptureContent/AddEntriesFromBooksModal/tests/Interaction Tests",
	component: AddEntriesFromBooksModal,
	parameters: {
		layout: "centered",
	},
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-scripture-id",
		onBootstrapSuccess: () => {},
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Modal content renders in a portal; query within the dialog. */
const getModalContent = () => {
	const dialog = within(document.body).getByRole("dialog", {
		name: /add entries from books/i,
	});
	return within(dialog);
};

/**
 * Bootstrap button is disabled when no canon selected.
 */
export const AddEntriesButtonDisabledWhenNoCanon: Story = {
	play: async ({ step }) => {
		await step("Wait for modal to load", async () => {
			await waitFor(
				() => {
					const content = getModalContent();
					expect(content.getByLabelText("Select canon")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Verify Add Entries button is disabled", async () => {
			const content = getModalContent();
			const addEntriesButton = content.getByRole("button", {
				name: /add entries from books/i,
			});
			expect(addEntriesButton).toBeDisabled();
		});
	},
};

/**
 * Canon selection enables extra books and changes dirty state.
 */
export const CanonSelectionEnablesExtraBooks: Story = {
	play: async ({ step }) => {
		await step("Wait for modal to load", async () => {
			await waitFor(
				() => {
					const content = getModalContent();
					expect(content.getByLabelText("Select canon")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Select Protestant canon", async () => {
			const content = getModalContent();
			const canonTrigger = content.getByLabelText("Select canon");
			await userEvent.click(canonTrigger);
			const protestantOption = await within(document.body).findByRole(
				"option",
				{ name: /protestant/i },
			);
			await userEvent.click(protestantOption);
		});

		await step("Verify extra books section is visible", async () => {
			await waitFor(() => {
				const content = getModalContent();
				expect(
					content.getByLabelText("Search extra books"),
				).toBeInTheDocument();
			});
		});

		await step("Verify Clear button is enabled (dirty)", async () => {
			const content = getModalContent();
			const clearButton = content.getByRole("button", {
				name: /clear form/i,
			});
			expect(clearButton).toBeEnabled();
		});
	},
};

/**
 * Corpus toggles change dirty state.
 */
export const CorpusTogglesChangeDirtyState: Story = {
	play: async ({ step }) => {
		await step("Wait for modal to load", async () => {
			await waitFor(
				() => {
					const content = getModalContent();
					expect(
						content.getByLabelText("Include Apocrypha"),
					).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Toggle Apocrypha checkbox", async () => {
			const content = getModalContent();
			const apocryphaCheckbox = content.getByLabelText("Include Apocrypha");
			await userEvent.click(apocryphaCheckbox);
			expect(apocryphaCheckbox).toBeChecked();
		});

		await step("Verify Clear button is enabled", async () => {
			const content = getModalContent();
			const clearButton = content.getByRole("button", {
				name: /clear form/i,
			});
			expect(clearButton).toBeEnabled();
		});
	},
};

/**
 * Add Entries button opens confirmation dialog after selecting canon.
 */
export const AddEntriesButtonOpensConfirmationDialog: Story = {
	play: async ({ step }) => {
		await step("Wait for modal to load", async () => {
			await waitFor(
				() => {
					const content = getModalContent();
					expect(content.getByLabelText("Select canon")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Select Protestant canon", async () => {
			const content = getModalContent();
			const canonTrigger = content.getByLabelText("Select canon");
			await userEvent.click(canonTrigger);
			const protestantOption = await within(document.body).findByRole(
				"option",
				{ name: /protestant/i },
			);
			await userEvent.click(protestantOption);
		});

		await step(
			"Click Add Entries and verify confirmation dialog opens",
			async () => {
				const content = getModalContent();
				const addEntriesButton = content.getByRole("button", {
					name: /add entries from books/i,
				});
				await userEvent.click(addEntriesButton);
				await waitFor(() => {
					const dialog = within(document.body).getByRole("dialog", {
						name: /adding entries from books/i,
					});
					expect(dialog).toBeInTheDocument();
				});
			},
		);
	},
};
