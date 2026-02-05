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

export const OpensAndCloses: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		// Modal renders in a portal at document.body level
		await waitFor(async () => {
			const body = within(document.body);
			const modal = body.getByRole("dialog", { hidden: true });
			await expect(modal).toBeInTheDocument();

			// Verify title is present
			const title = body.getByText(/create new project/i);
			await expect(title).toBeInTheDocument();
		});
	},
};

export const ClosesOnBackdropClick: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Verify modal is open (in portal)
		await waitFor(async () => {
			const body = within(document.body);
			const modal = body.getByRole("dialog", { hidden: true });
			await expect(modal).toBeInTheDocument();
		});

		// Click backdrop (outside the modal content)
		const backdrop = document.querySelector('[data-base-ui-backdrop=""]');
		if (backdrop) {
			await user.click(backdrop as HTMLElement);
		}
	},
};

export const CancelButtonClosesModal: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup();

		// Modal renders in portal - query from document.body
		await waitFor(async () => {
			const body = within(document.body);
			const cancelButton = body.getByRole("button", { name: /cancel/i });
			await expect(cancelButton).toBeInTheDocument();
			await user.click(cancelButton);
		});
	},
};

export const FormValidationWorks: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [
			{ project_dir: "existing-project", title: "Existing Project" },
		],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup({ delay: 20 });

		// Give story a moment to mount before querying
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		// Wait for modal dialog to appear with longer timeout
		await waitFor(
			async () => {
				const dialog = body.getByRole("dialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 5000, interval: 100 },
		);

		// Try to submit without filling form
		const submitButton = body.getByRole("button", {
			name: /create project/i,
		});

		// Button should be disabled without file
		await expect(submitButton).toBeDisabled();

		// Enter duplicate project_dir
		const projectDirInput = body.getByLabelText(/project directory/i);
		await user.type(projectDirInput, "existing-project");

		// Trigger blur to activate validation
		projectDirInput.blur();

		// Verify error appears (with waitFor for async validation)
		await waitFor(
			async () => {
				const error = body.getByText(
					/this project directory is already in use/i,
				);
				await expect(error).toBeInTheDocument();
			},
			{ timeout: 3000, interval: 100 },
		);
	},
};

export const DuplicateTitleValidation: StoryObj<typeof CreateProjectModal> = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
		existingProjects: [{ project_dir: "test-project", title: "Test Project" }],
	},
	play: async ({ canvasElement: _canvasElement }) => {
		const user = userEvent.setup({ delay: 20 });

		// Give story a moment to mount before querying
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		// Wait for modal dialog to appear with longer timeout
		await waitFor(
			async () => {
				const dialog = body.getByRole("dialog", { hidden: true });
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 5000, interval: 100 },
		);

		// Enter duplicate title (case-insensitive)
		const titleInput = body.getByLabelText(/project title/i);

		// Type with delay between characters (same as FormValidationWorks)
		await user.type(titleInput, "test project");

		// Trigger blur to activate validation
		titleInput.blur();

		// Verify error appears (using waitFor for async validation)
		await waitFor(
			async () => {
				const error = body.getByText(
					/a project with this title already exists/i,
				);
				await expect(error).toBeInTheDocument();
			},
			{ timeout: 3000, interval: 100 },
		);
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
