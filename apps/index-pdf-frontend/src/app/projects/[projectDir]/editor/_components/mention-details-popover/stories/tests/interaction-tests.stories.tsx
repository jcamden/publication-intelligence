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
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify text is truncated with ellipsis", async () => {
			const textElement = canvas.getByText(/this is a very long text/i);
			await expect(textElement.textContent).toMatch(/\.\.\."/);
		});
	},
};
