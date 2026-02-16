import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ProjectForm } from "../../project-form";

export default {
	...defaultInteractionTestMeta,
	title: "Projects/ProjectForm/tests/Interaction Tests",
	component: ProjectForm,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "padded",
	},
} satisfies Meta<typeof ProjectForm>;

export const SubmitButtonDisabledWithoutFile: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		// Fill in title
		const titleInput = canvas.getByLabelText(/project title/i);
		await user.type(titleInput, "Test Project");

		// Submit button should be disabled without file
		const submitButton = canvas.getByRole("button", {
			name: /create project/i,
		});
		await expect(submitButton).toBeDisabled();
	},
};

export const AutoPopulatesProjectDir: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);
		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Type a title with special characters
		await user.type(titleInput, "Word Biblical Commentary: Daniel (Vol. 30)");

		// Wait for auto-population (debounced at 500ms)
		await new Promise((resolve) => setTimeout(resolve, 600));

		// Verify project_dir is auto-populated and converted to kebab-case
		await expect(projectDirInput).toHaveValue(
			"word-biblical-commentary-daniel-vol-30",
		);
	},
};

export const ManualProjectDirStopsAutoPopulation: StoryObj<typeof ProjectForm> =
	{
		args: {
			onSuccess: () => {},
			onCancel: () => {},
			existingProjects: [],
		},
		play: async ({ canvasElement }) => {
			const canvas = within(canvasElement);
			const user = userEvent.setup();

			const titleInput = canvas.getByLabelText(/project title/i);
			const projectDirInput = canvas.getByLabelText(/project directory/i);

			// Manually set project_dir first
			await user.type(projectDirInput, "my-custom-dir");

			// Then type title
			await user.type(titleInput, "Different Title");

			// Wait for potential auto-population
			await new Promise((resolve) => setTimeout(resolve, 200));

			// project_dir should remain unchanged
			await expect(projectDirInput).toHaveValue("my-custom-dir");
		},
	};

export const ShowsDuplicateProjectDirError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Enter duplicate project_dir
		await user.type(projectDirInput, "existing-project");
		await user.tab();

		// Verify error appears
		const error = await canvas.findByText(
			/this project directory is already in use/i,
		);
		await expect(error).toBeVisible();
	},
};

export const ShowsDuplicateTitleError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [{ project_dir: "test-proj", title: "Test Project" }],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);

		// Enter duplicate title (case-insensitive)
		await user.type(titleInput, "test project");
		await user.tab();

		// Verify error appears
		const error = await canvas.findByText(
			/a project with this title already exists/i,
		);
		await expect(error).toBeVisible();
	},
};

export const ShowsInvalidProjectDirError: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Enter invalid characters (uppercase, spaces, special chars)
		await user.type(projectDirInput, "Invalid Project Dir!");
		await user.tab();

		// Verify error appears (use more specific text from the actual validation error)
		const error = await canvas.findByText(
			/must contain only lowercase letters, numbers, and hyphens \(e\.g\., my-project\)/i,
		);
		await expect(error).toBeVisible();
	},
};

export const DescriptionIsOptional: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);
		const descriptionInput = canvas.getByLabelText(/description/i);

		// Fill title but leave description empty
		await user.type(titleInput, "Test Project");
		await user.tab();

		// Verify no error on description field
		const descriptionField = descriptionInput.closest("[data-invalid]");
		if (descriptionField) {
			await expect(descriptionField).not.toHaveAttribute(
				"data-invalid",
				"true",
			);
		}
	},
};

// Edit Mode Tests
export const EditModePrePopulatesFields: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Existing Project Title",
			description: "Existing description",
			project_dir: "existing-project",
			selectedIndexTypes: ["subject", "author"],
			sourceDocument: {
				id: "doc-1",
				title: "Document Title",
				file_name: "existing-document.pdf",
				file_size: 1024000,
				page_count: 250,
			},
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify title is pre-populated
		const titleInput = canvas.getByLabelText(/project title/i);
		await expect(titleInput).toHaveValue("Existing Project Title");

		// Verify description is pre-populated
		const descriptionInput = canvas.getByLabelText(/description/i);
		await expect(descriptionInput).toHaveValue("Existing description");

		// Verify project_dir is pre-populated and editable
		const projectDirInput = canvas.getByLabelText(/project directory/i);
		await expect(projectDirInput).toHaveValue("existing-project");
		await expect(projectDirInput).not.toBeDisabled();

		// Verify submit button says "Update Project" not "Create Project"
		const submitButton = canvas.getByRole("button", {
			name: /update project/i,
		});
		await expect(submitButton).toBeVisible();
	},
};

export const EditModeShowsPdfThumbnail: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: {
				id: "doc-1",
				title: "Test Document",
				file_name: "test-document.pdf",
				file_size: 2048000,
				page_count: 100,
			},
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify source document section is displayed
		const sourceDocLabel = canvas.getByText(/source document/i);
		await expect(sourceDocLabel).toBeVisible();

		// Verify file name is displayed below thumbnail
		const fileName = canvas.getByText("test-document.pdf");
		await expect(fileName).toBeVisible();

		// Verify page count is displayed
		const pageCount = canvas.getByText("100 pages");
		await expect(pageCount).toBeVisible();
	},
};

export const EditModeProjectDirIsEditable: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Verify it's NOT read-only
		await expect(projectDirInput).not.toHaveAttribute("readonly");
		await expect(projectDirInput).not.toBeDisabled();

		// Clear and type new value
		await user.clear(projectDirInput);
		await user.type(projectDirInput, "updated-project");

		// Value should be changed
		await expect(projectDirInput).toHaveValue("updated-project");

		// Verify helper message about URL change
		const helperText = canvas.getByText(
			/changing this will update the project url/i,
		);
		await expect(helperText).toBeVisible();
	},
};

export const EditModeSubmitButtonAlwaysEnabled: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// In edit mode, submit button should be enabled even without a file
		const submitButton = canvas.getByRole("button", {
			name: /update project/i,
		});
		await expect(submitButton).not.toBeDisabled();
	},
};

export const EditModeCanModifyTitle: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Original Title",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);

		// Clear existing text and enter new title
		await user.clear(titleInput);
		await user.type(titleInput, "Updated Title");

		// Verify new value
		await expect(titleInput).toHaveValue("Updated Title");

		// Submit button should still be enabled
		const submitButton = canvas.getByRole("button", {
			name: /update project/i,
		});
		await expect(submitButton).not.toBeDisabled();
	},
};

export const EditModeAllowsSameTitleAsOriginal: StoryObj<typeof ProjectForm> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Original Title",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "test-project", title: "Original Title" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await step("Blur title field without changing it", async () => {
			const titleInput = canvas.getByLabelText(/project title/i);
			await expect(titleInput).toHaveValue("Original Title");

			// Focus and blur without changing
			await user.click(titleInput);
			await user.tab();
		});

		await step("Verify no duplicate error appears", async () => {
			// Should not show duplicate error for own title
			const errorText = canvas.queryByText(
				/a project with this title already exists/i,
			);
			expect(errorText).toBeNull();
		});
	},
};

export const EditModeBlocksDuplicateTitleFromOtherProject: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "My Project",
			description: null,
			project_dir: "my-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "my-project", title: "My Project" },
			{ project_dir: "other-project", title: "Other Project" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await step("Change title to another existing project's title", async () => {
			const titleInput = canvas.getByLabelText(/project title/i);
			await user.clear(titleInput);
			await user.type(titleInput, "Other Project");
			await user.tab();
		});

		await step("Verify duplicate error appears", async () => {
			const error = await canvas.findByText(
				/a project with this title already exists/i,
			);
			await expect(error).toBeVisible();
		});
	},
};

export const EditModeAllowsSameProjectDirAsOriginal: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "Test Project",
			description: null,
			project_dir: "test-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [{ project_dir: "test-project", title: "Test Project" }],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await step("Blur project_dir field without changing it", async () => {
			const projectDirInput = canvas.getByLabelText(/project directory/i);
			await expect(projectDirInput).toHaveValue("test-project");

			// Focus and blur without changing
			await user.click(projectDirInput);
			await user.tab();
		});

		await step("Verify no duplicate error appears", async () => {
			// Should not show duplicate error for own project_dir
			const errorText = canvas.queryByText(
				/this project directory is already in use/i,
			);
			expect(errorText).toBeNull();
		});
	},
};

export const EditModeBlocksDuplicateProjectDirFromOtherProject: StoryObj<
	typeof ProjectForm
> = {
	args: {
		mode: "edit",
		projectId: "project-123",
		initialData: {
			title: "My Project",
			description: null,
			project_dir: "my-project",
			selectedIndexTypes: ["subject"],
			sourceDocument: null,
		},
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "my-project", title: "My Project" },
			{ project_dir: "other-project", title: "Other Project" },
		],
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await step(
			"Change project_dir to another existing project's directory",
			async () => {
				const projectDirInput = canvas.getByLabelText(/project directory/i);
				await user.clear(projectDirInput);
				await user.type(projectDirInput, "other-project");
				await user.tab();
			},
		);

		await step("Verify duplicate error appears", async () => {
			const error = await canvas.findByText(
				/this project directory is already in use/i,
			);
			await expect(error).toBeVisible();
		});
	},
};
