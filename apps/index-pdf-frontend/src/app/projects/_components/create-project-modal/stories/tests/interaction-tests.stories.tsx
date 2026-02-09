import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor, within } from "@storybook/test";
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

		await step("Wait for modal to render", async () => {
			await waitFor(
				async () => {
					const dialog = screen.getByRole("dialog", { hidden: true });
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
		});

		await step("Verify submit button is disabled without file", async () => {
			const submitButton = screen.getByRole("button", {
				name: /create project/i,
			});
			await expect(submitButton).toBeDisabled();
		});

		await step("Enter duplicate project_dir", async () => {
			const projectDirInput = screen.getByLabelText(/project directory/i);
			await user.type(projectDirInput, "existing-project");
			(projectDirInput as HTMLElement).blur();
		});

		await step("Verify error appears", async () => {
			await waitFor(
				async () => {
					const error = screen.getByText(
						/this project directory is already in use/i,
					);
					await expect(error).toBeInTheDocument();
				},
				{ timeout: 3000, interval: 100 },
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

		await step("Wait for modal to render", async () => {
			await waitFor(
				async () => {
					const dialog = screen.getByRole("dialog", { hidden: true });
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
		});

		await step("Enter duplicate title (case-insensitive)", async () => {
			const titleInput = screen.getByLabelText(/project title/i);
			await user.type(titleInput, "test project");
			await user.tab();
		});

		await step("Verify error appears", async () => {
			const error = await screen.findByText(
				/a project with this title already exists/i,
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

		// Wait for modal dialog to appear
		await waitFor(
			async () => {
				const dialog = body.getByRole("dialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		const titleInput = body.getByLabelText(/project title/i);
		const projectDirInput = body.getByLabelText(/project directory/i);

		// Type with delay between characters to let form subscription fire
		await user.type(titleInput, "Word Biblical Commentary: Daniel");

		// Wait for auto-population (debounced at 150ms)
		// Need to wait for debounce timer + form update time
		await waitFor(
			async () => {
				const value = (projectDirInput as HTMLInputElement).value;
				await expect(value).toBe("word-biblical-commentary-daniel");
			},
			{ timeout: 3000, interval: 100 },
		);
	},
};
