import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { DeleteMentionDialog } from "../../delete-mention-dialog";

const meta = {
	title:
		"Projects/[ProjectDir]/Editor/DeleteMentionDialog/tests/Interaction Tests",
	component: DeleteMentionDialog,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof DeleteMentionDialog>;

export default meta;
type Story = StoryObj<typeof DeleteMentionDialog>;

export const ConfirmDelete: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Wait for dialog to appear", async () => {
			await waitFor(
				async () => {
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 1000 },
			);
		});

		await step("Click Delete button", async () => {
			const deleteButton = body.getByRole("button", { name: /delete/i });
			await userEvent.click(deleteButton);
		});
	},
};

export const CancelDelete: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Wait for dialog to appear", async () => {
			await waitFor(
				async () => {
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 1000 },
			);
		});

		await step("Click Cancel button", async () => {
			const cancelButton = body.getByRole("button", { name: /cancel/i });
			await userEvent.click(cancelButton);
		});
	},
};

export const VerifyContent: Story = {
	args: {
		isOpen: true,
		onOpenChange: ({ open }) => {
			console.log("Open changed:", open);
		},
		onConfirm: () => {
			console.log("Delete confirmed");
		},
	},
	play: async ({ step }) => {
		const body = within(document.body);

		await step("Wait for dialog to appear", async () => {
			await waitFor(
				async () => {
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 1000 },
			);
		});

		await step("Verify title is displayed", async () => {
			await expect(body.getByText(/delete highlight/i)).toBeInTheDocument();
		});

		await step("Verify description is displayed", async () => {
			await expect(
				body.getByText(/this will remove the highlight/i),
			).toBeInTheDocument();
		});

		await step("Verify both buttons are present", async () => {
			await expect(
				body.getByRole("button", { name: /cancel/i }),
			).toBeInTheDocument();
			await expect(
				body.getByRole("button", { name: /delete/i }),
			).toBeInTheDocument();
		});
	},
};
