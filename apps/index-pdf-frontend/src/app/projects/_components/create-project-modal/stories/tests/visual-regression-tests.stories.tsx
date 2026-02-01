import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { CreateProjectModal } from "../../create-project-modal";

export default {
	title: "Projects/CreateProjectModal/tests/Visual Regression Tests",
	component: CreateProjectModal,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "fullscreen",
	},
} satisfies Meta<typeof CreateProjectModal>;

export const DefaultLight: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
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

export const WithValidationErrorsLight: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	globals: {
		...defaultGlobals,
		theme: "light",
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		// Wait for modal to appear
		await waitFor(async () => {
			const titleInput = body.getByLabelText(/project title/i);
			await expect(titleInput).toBeInTheDocument();
		});

		const titleInput = body.getByLabelText(/project title/i);
		const projectDirInput = body.getByLabelText(/project directory/i);

		// Trigger validation errors
		await user.type(titleInput, "Existing Project");
		await user.tab();
		await user.type(projectDirInput, "existing-project");
		await user.tab();
	},
};

export const WithValidationErrorsDark: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
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
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		// Wait for modal to appear
		await waitFor(async () => {
			const titleInput = body.getByLabelText(/project title/i);
			await expect(titleInput).toBeInTheDocument();
		});

		const titleInput = body.getByLabelText(/project title/i);
		const projectDirInput = body.getByLabelText(/project directory/i);

		// Trigger validation errors
		await user.type(titleInput, "Existing Project");
		await user.tab();
		await user.type(projectDirInput, "existing-project");
		await user.tab();
	},
};
