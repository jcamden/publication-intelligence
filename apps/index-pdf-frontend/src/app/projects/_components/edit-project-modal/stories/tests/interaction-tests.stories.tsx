import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor } from "@storybook/test";
import { EditProjectModal } from "../../edit-project-modal";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/EditProjectModal/tests/Interaction Tests",
	component: EditProjectModal,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
} satisfies Meta<typeof EditProjectModal>;

export const DeleteButtonOpensConfirmation: StoryObj<typeof EditProjectModal> =
	{
		args: {
			open: true,
			onOpenChange: () => {},
			onSuccess: () => {},
			projectId: "project-123",
			existingProjects: [],
		},
		play: async ({ step }) => {
			const user = userEvent.setup();

			await step("Wait for modal to render", async () => {
				await waitFor(async () => {
					const modal = screen.getByRole("dialog", { hidden: true });
					await expect(modal).toBeInTheDocument();
				});
			});

			await step("Wait for project data to load", async () => {
				await new Promise((resolve) => setTimeout(resolve, 500));
			});

			await step("Click delete button", async () => {
				const deleteButton = screen.getByRole("button", {
					name: /delete project/i,
				});
				await user.click(deleteButton);
			});

			await step("Verify confirmation dialog appears", async () => {
				// DeleteProjectDialog renders as a separate AlertDialog
				await waitFor(async () => {
					const confirmDialog = screen.getByText(
						/are you sure you want to delete this project/i,
					);
					await expect(confirmDialog).toBeVisible();
				});
			});

			await step("Verify confirmation input is required", async () => {
				const confirmInput = screen.getByPlaceholderText(
					/type project name to confirm/i,
				);
				await expect(confirmInput).toBeInTheDocument();

				// Delete button in confirmation dialog should be disabled
				const deleteConfirmButton = screen.getByRole("button", {
					name: /^delete$/i,
				});
				await expect(deleteConfirmButton).toBeDisabled();
			});
		},
	};

export const ShowsErrorWhenTitleMatchesOtherProject: StoryObj<
	typeof EditProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();

		await step("Wait for modal to render", async () => {
			await waitFor(async () => {
				const modal = screen.getByRole("dialog", { hidden: true });
				await expect(modal).toBeInTheDocument();
			});
		});

		await step("Wait for project data to load", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Change title to existing project title", async () => {
			const titleInput = screen.getByLabelText(/project title/i);
			await user.clear(titleInput);
			await user.type(titleInput, "Another Project");
			await user.tab();
		});

		await step("Verify validation error appears", async () => {
			await waitFor(async () => {
				const errorMessage = screen.getByText(
					/a project with this title already exists/i,
				);
				await expect(errorMessage).toBeVisible();
			});
		});
	},
};

export const ShowsErrorWhenProjectDirMatchesOtherProject: StoryObj<
	typeof EditProjectModal
> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();

		await step("Wait for modal to render", async () => {
			await waitFor(async () => {
				const modal = screen.getByRole("dialog", { hidden: true });
				await expect(modal).toBeInTheDocument();
			});
		});

		await step("Wait for project data to load", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Change project_dir to existing project_dir", async () => {
			const projectDirInput = screen.getByLabelText(/project directory/i);
			await user.clear(projectDirInput);
			await user.type(projectDirInput, "another-project");
			await user.tab();
		});

		await step("Verify validation error appears", async () => {
			await waitFor(async () => {
				const errorMessage = screen.getByText(
					/this project directory is already in use/i,
				);
				await expect(errorMessage).toBeVisible();
			});
		});
	},
};

export const AllowsKeepingSameTitle: StoryObj<typeof EditProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();

		await step("Wait for modal to render", async () => {
			await waitFor(async () => {
				const modal = screen.getByRole("dialog", { hidden: true });
				await expect(modal).toBeInTheDocument();
			});
		});

		await step("Wait for project data to load", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Keep the same title (no change)", async () => {
			const titleInput = screen.getByLabelText(/project title/i);
			await expect(titleInput).toHaveValue("Test Project Title");
			await user.click(titleInput);
			await user.tab();
		});

		await step("Verify no validation error appears", async () => {
			const errorMessage = screen.queryByText(
				/a project with this title already exists/i,
			);
			await expect(errorMessage).not.toBeInTheDocument();
		});
	},
};

export const AllowsKeepingSameProjectDir: StoryObj<typeof EditProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		projectId: "project-123",
		existingProjects: [
			{ project_dir: "test-project", title: "Test Project Title" },
			{ project_dir: "another-project", title: "Another Project" },
		],
	},
	play: async ({ step }) => {
		const user = userEvent.setup();

		await step("Wait for modal to render", async () => {
			await waitFor(async () => {
				const modal = screen.getByRole("dialog", { hidden: true });
				await expect(modal).toBeInTheDocument();
			});
		});

		await step("Wait for project data to load", async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step(
			"Change the title (which auto-updates project_dir)",
			async () => {
				const titleInput = screen.getByLabelText(/project title/i);
				await user.clear(titleInput);
				await user.type(titleInput, "Updated Title");
			},
		);

		await step("Wait for debounced project_dir update", async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step(
			"Manually revert project_dir back to original value",
			async () => {
				const projectDirInput = screen.getByLabelText(/project directory/i);
				await user.clear(projectDirInput);
				await user.type(projectDirInput, "test-project");
				await user.tab();
			},
		);

		await step("Verify no validation error appears", async () => {
			const errorMessage = screen.queryByText(
				/this project directory is already in use/i,
			);
			await expect(errorMessage).not.toBeInTheDocument();
		});
	},
};
