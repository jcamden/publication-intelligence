import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { CreateProjectModal } from "../../create-project-modal";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/CreateProjectModal/tests/Interaction Tests",
	component: CreateProjectModal,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof CreateProjectModal>;

export const ShowsErrorWhenProjectDirAlreadyExists: StoryObj<
	typeof CreateProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup({ delay: 20 });
		const body = within(document.body);

		// Wait for CreateProjectModal dialog (by name) to appear. Scoping by name avoids
		// matching stale dialogs from previous stories when tests run in parallel.
		await step("Wait for modal to render", async () => {
			await waitFor(
				async () => {
					const dialog = body.getByRole("dialog", {
						name: /create new project/i,
						hidden: true,
					});
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
		});

		const dialog = body.getByRole("dialog", {
			name: /create new project/i,
			hidden: true,
		});
		const modal = within(dialog);

		await step("Verify submit button is disabled without file", async () => {
			const submitButton = modal.getByRole("button", {
				name: /create project/i,
			});
			await expect(submitButton).toBeDisabled();
		});

		await step("Enter duplicate project_dir", async () => {
			const projectDirInput = modal.getByLabelText(/project directory/i);
			await user.type(projectDirInput, "existing-project");
			(projectDirInput as HTMLElement).blur();
		});

		await step("Verify error appears", async () => {
			await waitFor(
				async () => {
					const error = modal.getByText(
						/this project directory is already in use/i,
					);
					await expect(error).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
		});
	},
};

export const ShowsErrorWhenTitleAlreadyExists: StoryObj<
	typeof CreateProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [{ project_dir: "test-project", title: "Test Project" }],
	},
	play: async ({ step }) => {
		const user = userEvent.setup({ delay: 20 });
		const body = within(document.body);

		// Wait for CreateProjectModal dialog (by name) to appear. Scoping by name avoids
		// matching stale dialogs from previous stories when tests run in parallel.
		await step("Wait for modal to render", async () => {
			await waitFor(
				async () => {
					const dialog = body.getByRole("dialog", {
						name: /create new project/i,
						hidden: true,
					});
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
		});

		const dialog = body.getByRole("dialog", {
			name: /create new project/i,
			hidden: true,
		});
		const modal = within(dialog);

		await step("Enter duplicate title (case-insensitive)", async () => {
			const titleInput = modal.getByLabelText(/project title/i);
			await user.type(titleInput, "test project");
			await user.tab();
		});

		// Validation runs on blur; use waitFor with generous timeout for debounced
		// React updates when tests run under load (e.g. parallel pre-commit).
		await step("Verify error appears", async () => {
			const error = modal.getByText(
				"A project with this title already exists. Please choose a different title.",
			);
			await expect(error).toBeVisible();
		});
	},
};

export const AutoPopulatesProjectDir: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup({ delay: 20 });

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		// Wait for CreateProjectModal dialog (by name) to appear.
		// Scoping by name avoids matching stale dialogs from previous stories when pre-commit
		// runs multiple test suites and DOM cleanup may lag.
		await waitFor(
			async () => {
				const dialog = body.getByRole("dialog", {
					name: /create new project/i,
					hidden: true,
				});
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);

		const dialog = body.getByRole("dialog", {
			name: /create new project/i,
			hidden: true,
		});
		const modal = within(dialog);
		const titleInput = modal.getByLabelText(/project title/i);
		const projectDirInput = modal.getByLabelText(/project directory/i);

		// Type with delay between characters to let form subscription fire
		await user.type(titleInput, "Word Biblical Commentary: Daniel");

		// Wait for auto-population (debounced at 500ms in ProjectForm).
		// Use waitFor with generous timeout - pre-commit runs multiple tasks in parallel
		// and can be CPU-bound, causing debounce/React updates to run slower.
		await waitFor(
			async () => {
				await expect(projectDirInput).toHaveValue(
					"word-biblical-commentary-daniel",
				);
			},
			{ timeout: 8000, interval: 150 },
		);
	},
};
