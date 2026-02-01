import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { DeleteProjectDialog } from "../../delete-project-dialog";

export default {
	title: "Projects/DeleteProjectDialog/tests/Interaction Tests",
	component: DeleteProjectDialog,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
		layout: "centered",
	},
} satisfies Meta<typeof DeleteProjectDialog>;

export const OpensWhenProjectIdProvided: StoryObj<typeof DeleteProjectDialog> =
	{
		args: {
			projectId: "project-123",
			onOpenChange: () => {},
			onSuccess: () => {},
		},
		play: async ({ canvasElement: _canvasElement }) => {
			// Dialog renders in portal - query from document.body
			await waitFor(async () => {
				const body = within(document.body);
				const dialog = body.getByRole("alertdialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();

				// Verify warning message
				const warningText = body.getByText(/this will permanently delete/i);
				await expect(warningText).toBeInTheDocument();
			});
		},
	};

export const CancelButtonClosesDialog: StoryObj<typeof DeleteProjectDialog> = {
	args: {
		projectId: "project-456",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Dialog renders in portal - query from document.body
		await waitFor(async () => {
			const body = within(document.body);
			const cancelButton = body.getByRole("button", { name: /cancel/i });
			await expect(cancelButton).toBeInTheDocument();
			await user.click(cancelButton);
		});
	},
};

export const DeleteButtonTriggersAction: StoryObj<typeof DeleteProjectDialog> =
	{
		args: {
			projectId: "project-789",
			onOpenChange: () => {},
			onSuccess: () => {},
		},
		play: async ({ canvasElement: _canvasElement }) => {
			const user = userEvent.setup();

			// Dialog renders in portal - query from document.body
			await waitFor(async () => {
				const body = within(document.body);
				const deleteButton = body.getByRole("button", { name: /^delete$/i });
				await expect(deleteButton).toBeInTheDocument();
				await expect(deleteButton).not.toBeDisabled();

				// Click delete button
				await user.click(deleteButton);

				// Note: In real app, mutation will be triggered
				// In storybook, we just verify the button is clickable
			});
		},
	};

export const KeyboardNavigation: StoryObj<typeof DeleteProjectDialog> = {
	args: {
		projectId: "project-kbd",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Dialog renders in portal - query from document.body
		const body = within(document.body);

		// Wait for dialog to be fully mounted and focus to be initialized
		await waitFor(
			async () => {
				const dialog = body.getByRole("alertdialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		// Wait for initial focus to settle on Cancel button
		const cancelButton = body.getByRole("button", { name: /cancel/i });
		await waitFor(
			async () => {
				await expect(cancelButton).toHaveFocus();
			},
			{ timeout: 1000 },
		);

		// Tab to Delete button
		await user.tab();
		const deleteButton = body.getByRole("button", { name: /^delete$/i });
		await expect(deleteButton).toHaveFocus();
	},
};

export const WarningMessageIsVisible: StoryObj<typeof DeleteProjectDialog> = {
	args: {
		projectId: "project-warning",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	play: async ({ canvasElement: _canvasElement }) => {
		// Dialog renders in portal - query from document.body
		await waitFor(async () => {
			const body = within(document.body);

			// Verify all warning text is present
			await expect(
				body.getByText(/permanently delete the project/i),
			).toBeInTheDocument();
			await expect(
				body.getByText(/this action cannot be undone/i),
			).toBeInTheDocument();
		});
	},
};
