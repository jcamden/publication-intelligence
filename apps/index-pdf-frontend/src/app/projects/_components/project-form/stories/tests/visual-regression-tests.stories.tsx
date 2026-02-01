import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { ProjectForm } from "../../project-form";

export default {
	title: "Projects/ProjectForm/tests/Visual Regression Tests",
	component: ProjectForm,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "padded",
	},
} satisfies Meta<typeof ProjectForm>;

export const DefaultLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};

export const WithValidationErrorsLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);
		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Trigger validation errors
		await user.type(titleInput, "Existing Project");
		await user.tab();
		await user.type(projectDirInput, "existing-project");
		await user.tab();
	},
};

export const WithValidationErrorsDark: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);
		const projectDirInput = canvas.getByLabelText(/project directory/i);

		// Trigger validation errors
		await user.type(titleInput, "Existing Project");
		await user.tab();
		await user.type(projectDirInput, "existing-project");
		await user.tab();
	},
};

export const FilledFormLight: StoryObj<typeof ProjectForm> = {
	args: {
		onSuccess: () => {},
		onCancel: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const titleInput = canvas.getByLabelText(/project title/i);
		const descriptionInput = canvas.getByLabelText(/description/i);

		await user.type(titleInput, "Word Biblical Commentary: Daniel");
		await user.type(
			descriptionInput,
			"A comprehensive theological and exegetical analysis",
		);

		// Wait for auto-population
		await new Promise((resolve) => setTimeout(resolve, 200));
	},
};
