import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { DeleteProjectDialog } from "../../delete-project-dialog";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/DeleteProjectDialog/tests/Interaction Tests",
	component: DeleteProjectDialog,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof DeleteProjectDialog>;

export const DeleteButtonEnabledAfterConfirmation: StoryObj<
	typeof DeleteProjectDialog
> = {
	args: {
		projectId: "project-confirm",
		onOpenChange: () => {},
		onSuccess: () => {},
	},
	play: async ({ canvasElement: _canvasElement, step }) => {
		const user = userEvent.setup();
		const body = within(document.body);

		await step("Wait for dialog to open", async () => {
			await waitFor(async () => {
				const dialog = body.getByRole("alertdialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();
			});
		});

		await step("Wait for project data to load", async () => {
			// Give the tRPC query time to resolve
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Type incorrect confirmation text", async () => {
			const confirmInput = body.getByPlaceholderText(
				/type project name to confirm/i,
			);
			await user.type(confirmInput, "wrong name");

			const deleteButton = body.getByRole("button", { name: /^delete$/i });
			await expect(deleteButton).toBeDisabled();
		});

		await step("Clear and type correct confirmation text", async () => {
			const confirmInput = body.getByPlaceholderText(
				/type project name to confirm/i,
			);
			await user.clear(confirmInput);

			// Type the correct project name from mock (see trpc-decorator.tsx)
			await user.type(confirmInput, "Test Project Title");

			// Wait for debounced validation (150ms delay in component)
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step(
			"Verify delete button is enabled with correct text",
			async () => {
				const deleteButton = body.getByRole("button", { name: /^delete$/i });
				await expect(deleteButton).toBeEnabled();
			},
		);
	},
};
