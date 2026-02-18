import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { MentionDetailsPopover } from "../../mention-details-popover";

const mockIndexEntries = [
	{ id: "entry-1", label: "Critique of Pure Reason", parentId: "parent-1" },
	{ id: "parent-1", label: "Kant", parentId: null },
	{ id: "entry-2", label: "Philosophy", parentId: null },
	{ id: "entry-3", label: "The Republic", parentId: "parent-2" },
	{ id: "parent-2", label: "Plato", parentId: null },
	{ id: "entry-4", label: "Test Entry", parentId: null },
	{ id: "entry-5", label: "Test Entry", parentId: null },
	{ id: "entry-6", label: "Test Entry", parentId: null },
	{ id: "entry-7", label: "Test Entry", parentId: null },
];

const meta = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/MentionDetailsPopover/tests/Interaction Tests",
	component: MentionDetailsPopover,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof MentionDetailsPopover>;

export default meta;
type Story = StoryObj<typeof MentionDetailsPopover>;

export const ViewModeDefault: Story = {
	args: {
		mention: {
			id: "mention-1",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify View mode displays read-only fields", async () => {
			await expect(canvas.getByText(/sample text/i)).toBeInTheDocument();
			await expect(
				canvas.getByText(/kant → critique of pure reason/i),
			).toBeInTheDocument();
		});

		await step("Verify Edit and Close buttons are visible", async () => {
			await expect(
				canvas.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument();
			await expect(
				canvas.getByRole("button", { name: /close/i }),
			).toBeInTheDocument();
		});

		await step(
			"Verify editable fields are not present in view mode",
			async () => {
				expect(canvas.queryByTestId("entry-combobox")).not.toBeInTheDocument();
			},
		);
	},
};

export const EnterEditMode: Story = {
	args: {
		mention: {
			id: "mention-2",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click Edit button", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Verify Edit mode UI is displayed", async () => {
			await expect(canvas.getByTestId("entry-combobox")).toBeInTheDocument();
		});

		await step("Verify Edit mode buttons are visible", async () => {
			await expect(
				canvas.getByRole("button", { name: /delete/i }),
			).toBeInTheDocument();
			await expect(
				canvas.getByRole("button", { name: /cancel/i }),
			).toBeInTheDocument();
			await expect(
				canvas.getByRole("button", { name: /save/i }),
			).toBeInTheDocument();
		});
	},
};

export const CancelEditMode: Story = {
	args: {
		mention: {
			id: "mention-3",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Enter Edit mode", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Click Cancel button", async () => {
			const cancelButton = canvas.getByRole("button", { name: /cancel/i });
			await userEvent.click(cancelButton);
		});

		await step("Verify returned to View mode", async () => {
			await expect(
				canvas.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument();
			await expect(
				canvas.getByRole("button", { name: /close/i }),
			).toBeInTheDocument();
		});
	},
};

export const SaveChanges: Story = {
	args: {
		mention: {
			id: "mention-4",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Enter Edit mode", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Change page sublocation", async () => {
			const sublocationInput = canvas.getByTestId("sublocation-input");
			await userEvent.clear(sublocationInput);
			await userEvent.type(sublocationInput, "10:45.a");
		});

		await step("Click Save button", async () => {
			const saveButton = canvas.getByRole("button", { name: /save/i });
			await userEvent.click(saveButton);
		});

		await step("Verify returned to View mode", async () => {
			await expect(
				canvas.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument();
		});
	},
};

export const EditRegionText: Story = {
	args: {
		mention: {
			id: "mention-5",
			pageNumber: 42,
			text: "Original region description",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "region" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			text,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log("Close with updated text:", text);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Enter Edit mode", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Verify region text input is editable", async () => {
			const textInput = canvas.getByTestId("region-text-input");
			await expect(textInput).toBeInTheDocument();
			await expect(textInput).toHaveValue("Original region description");
		});

		await step("Edit region text", async () => {
			const textInput = canvas.getByTestId(
				"region-text-input",
			) as HTMLInputElement;
			await userEvent.clear(textInput);
			await userEvent.type(textInput, "Updated region description");
		});

		await step("Verify text was updated", async () => {
			const textInput = canvas.getByTestId(
				"region-text-input",
			) as HTMLInputElement;
			await expect(textInput).toHaveValue("Updated region description");
		});
	},
};

export const TextTypeReadonly: Story = {
	args: {
		mention: {
			id: "mention-6",
			pageNumber: 42,
			text: "Extracted text from PDF",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Enter Edit mode", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Verify text type is readonly (no input field)", async () => {
			expect(canvas.queryByTestId("region-text-input")).not.toBeInTheDocument();
			await expect(
				canvas.getByText(/extracted text from pdf/i),
			).toBeInTheDocument();
		});
	},
};

export const CloseButtonClick: Story = {
	args: {
		mention: {
			id: "mention-7",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click Close button", async () => {
			const closeButton = canvas.getByRole("button", { name: /close/i });
			await userEvent.click(closeButton);
		});
	},
};

export const DeleteInEditMode: Story = {
	args: {
		mention: {
			id: "mention-8",
			pageNumber: 42,
			text: "Sample text",
			entryLabel: "Kant → Critique of Pure Reason",
			entryId: "entry-1",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Enter Edit mode", async () => {
			const editButton = canvas.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Click Delete button", async () => {
			const deleteButton = canvas.getByRole("button", { name: /delete/i });
			await userEvent.click(deleteButton);
		});
	},
};

export const DisplaysCorrectInformation: Story = {
	args: {
		mention: {
			id: "mention-9",
			pageNumber: 99,
			text: "This is the highlighted text from the document",
			entryLabel: "Plato → The Republic",
			entryId: "entry-3",
			indexType: "subject",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: ({
			mentionId,
			entryId,
			text,
			pageSublocation,
		}: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			console.log(
				"Close with updates:",
				mentionId,
				entryId,
				text,
				pageSublocation,
			);
		},
		onCancel: () => {
			console.log("Cancel clicked");
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
	},
};

export const TruncatesLongText: Story = {
	args: {
		mention: {
			id: "mention-10",
			pageNumber: 1,
			text: "This is a very long text snippet that exceeds 100 characters and should be truncated with ellipsis to prevent the popover from becoming too wide and unwieldy for the user interface",
			entryLabel: "Test Entry",
			entryId: "entry-4",
			indexType: "scripture",
			type: "text" as const,
		},
		existingEntries: mockIndexEntries,
		onDelete: ({ mentionId }: { mentionId: string }) => {
			console.log("Delete clicked:", mentionId);
		},
		onClose: () => {
			console.log("Cancel clicked");
		},
		onCancel: () => {
			console.log("Cancel clicked");
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify text is truncated with ellipsis", async () => {
			const textElement = canvas.getByText(/this is a very long text/i);
			await expect(textElement.textContent).toMatch(/\.\.\./);
		});
	},
};
