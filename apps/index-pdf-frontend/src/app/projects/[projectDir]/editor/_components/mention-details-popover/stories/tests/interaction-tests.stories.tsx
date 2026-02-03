import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { MentionDetailsPopover } from "../../mention-details-popover";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/MentionDetailsPopover/tests/Interaction Tests",
	component: MentionDetailsPopover,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof MentionDetailsPopover>;

export default meta;
type Story = StoryObj<typeof MentionDetailsPopover>;

export const EditButtonClick: Story = {
	args: {
		mention: {
			id: "mention-1",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexTypes: ["subject"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click Edit Entry button", async () => {
			const editButton = canvas.getByRole("button", { name: /edit entry/i });
			await userEvent.click(editButton);
		});
	},
};

export const DeleteButtonClick: Story = {
	args: {
		mention: {
			id: "mention-2",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Philosophy",
			entryId: "entry-2",
			indexTypes: ["author"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click Delete button", async () => {
			const deleteButton = canvas.getByRole("button", { name: /delete/i });
			await userEvent.click(deleteButton);
		});
	},
};

export const DisplaysCorrectInformation: Story = {
	args: {
		mention: {
			id: "mention-3",
			pageNumber: 99,
			text: "This is the highlighted text from the document",
			entryLabel: "Plato → The Republic",
			entryId: "entry-3",
			indexTypes: ["subject"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify text is displayed", async () => {
			await expect(
				canvas.getByText(/this is the highlighted text/i),
			).toBeInTheDocument();
		});

		await step("Verify entry label is displayed", async () => {
			await expect(
				canvas.getByText(/plato → the republic/i),
			).toBeInTheDocument();
		});

		await step("Verify page number is displayed", async () => {
			await expect(canvas.getByText(/99/)).toBeInTheDocument();
		});
	},
};

export const TruncatesLongText: Story = {
	args: {
		mention: {
			id: "mention-4",
			pageNumber: 1,
			text: "This is a very long text snippet that exceeds 100 characters and should be truncated with ellipsis to prevent the popover from becoming too wide and unwieldy for the user interface",
			entryLabel: "Test Entry",
			entryId: "entry-4",
			indexTypes: ["scripture"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify text is truncated with ellipsis", async () => {
			const textElement = canvas.getByText(/this is a very long text/i);
			await expect(textElement.textContent).toMatch(/\.\.\."/);
		});
	},
};

export const SelectSingleIndexType: Story = {
	args: {
		mention: {
			id: "mention-5",
			pageNumber: 10,
			text: "Test text",
			entryLabel: "Test Entry",
			entryId: "entry-5",
			indexTypes: ["subject"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify initial trigger shows Subject", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			await expect(selectTrigger.textContent).toMatch(/subject/i);
		});

		await step(
			"Open dropdown, deselect Subject, and select Author",
			async () => {
				const selectTrigger = canvas.getByTestId("index-types-select");
				await userEvent.click(selectTrigger);

				const body = within(document.body);

				// Deselect Subject first
				const subjectOption = body.getByRole("option", { name: /subject/i });
				await userEvent.click(subjectOption);

				// Then select Author
				const authorOption = body.getByRole("option", { name: /author/i });
				await userEvent.click(authorOption);
			},
		);

		await step("Close dropdown", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify trigger now shows only Author", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			const triggerText = selectTrigger.textContent || "";
			await expect(triggerText).toMatch(/author/i);
			await expect(triggerText).not.toMatch(/subject/i);
		});
	},
};

export const SelectMultipleIndexTypes: Story = {
	args: {
		mention: {
			id: "mention-6",
			pageNumber: 20,
			text: "Multi-type mention",
			entryLabel: "Test Entry",
			entryId: "entry-6",
			indexTypes: ["subject"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Open dropdown and select Author", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			await userEvent.click(selectTrigger);

			const body = within(document.body);
			const authorOption = body.getByRole("option", { name: /author/i });
			await userEvent.click(authorOption);
		});

		await step("Select Scripture as well", async () => {
			const body = within(document.body);
			const scriptureOption = body.getByRole("option", { name: /scripture/i });
			await userEvent.click(scriptureOption);
		});

		await step("Close dropdown", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify trigger shows 3 selected items", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			const triggerText = selectTrigger.textContent || "";
			// Should show "3 selected" or list all three
			await expect(
				triggerText.includes("3") ||
					(triggerText.includes("Subject") &&
						triggerText.includes("Author") &&
						triggerText.includes("Scripture")),
			).toBe(true);
		});
	},
};

export const DeselectIndexType: Story = {
	args: {
		mention: {
			id: "mention-7",
			pageNumber: 30,
			text: "All types selected",
			entryLabel: "Test Entry",
			entryId: "entry-7",
			indexTypes: ["subject", "author", "scripture"],
		},
		onEdit: ({ mentionId }) => {
			console.log("Edit clicked:", mentionId);
		},
		onDelete: ({ mentionId }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({ mentionId, indexTypes }) => {
			console.log("Close with updated types:", mentionId, indexTypes);
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify initial trigger shows 3 items", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			const triggerText = selectTrigger.textContent || "";
			await expect(
				triggerText.includes("3") ||
					(triggerText.includes("Subject") &&
						triggerText.includes("Author") &&
						triggerText.includes("Scripture")),
			).toBe(true);
		});

		await step("Open dropdown and deselect Author", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			await userEvent.click(selectTrigger);

			const body = within(document.body);
			const authorOption = body.getByRole("option", { name: /author/i });
			await expect(authorOption).toHaveAttribute("data-selected");
			await userEvent.click(authorOption);
		});

		await step("Close dropdown", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify trigger now shows 2 items", async () => {
			const selectTrigger = canvas.getByTestId("index-types-select");
			const triggerText = selectTrigger.textContent || "";
			await expect(
				triggerText.includes("2") ||
					(triggerText.includes("Subject") &&
						triggerText.includes("Scripture") &&
						!triggerText.includes("Author")),
			).toBe(true);
		});
	},
};
