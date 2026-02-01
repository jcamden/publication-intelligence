import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { ProjectForm } from "../../project-form";

export default {
	title: "Projects/ProjectForm/tests/Interaction Tests",
	component: ProjectForm,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
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

		// Wait for auto-population (debounced)
		await new Promise((resolve) => setTimeout(resolve, 200));

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

export const CancelButtonWorks: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const cancelButton = canvas.getByRole("button", { name: /cancel/i });
		await expect(cancelButton).toBeVisible();
		await expect(cancelButton).not.toBeDisabled();

		await user.click(cancelButton);
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
