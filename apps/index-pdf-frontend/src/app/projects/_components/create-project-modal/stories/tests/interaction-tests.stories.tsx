import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { CreateProjectModal } from "../../create-project-modal";

/**
 * Sets a controlled `<input>` value without importing `@testing-library/react`.
 * That import breaks Storybook+Vite browser tests (dynamic import of react-18 chunks).
 */
function setControlledInputValue(element: HTMLElement, value: string): void {
	const input = element as HTMLInputElement;
	const valueSetter = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		"value",
	)?.set;
	if (valueSetter) {
		valueSetter.call(input, value);
	} else {
		input.value = value;
	}
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
}

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
			await waitFor(
				async () => {
					const error = modal.getByText(
						/a project with this title already exists/i,
					);
					await expect(error).toBeInTheDocument();
				},
				{ timeout: 5000, interval: 100 },
			);
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
	play: async ({ step }) => {
		// No per-keystroke delay: a 500ms title debounce can otherwise fire mid-typing
		// (e.g. while only "W" is in the field) and leave project_dir stuck at "w".
		const user = userEvent.setup();

		// Modal renders in portal - query from document.body
		const body = within(document.body);

		await step("Wait for modal dialog", async () => {
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
		});

		const dialog = body.getByRole("dialog", {
			name: /create new project/i,
			hidden: true,
		});
		const modal = within(dialog);
		const titleInput = modal.getByLabelText(/project title/i);
		const projectDirInput = modal.getByLabelText(/project directory/i);

		const fullTitle = "Word Biblical Commentary: Daniel";

		await step("Enter project title", async () => {
			await user.click(titleInput);
			// Single atomic update keeps debounced title + slug in sync; userEvent.type
			// can flake under load (partial value like "Wor").
			setControlledInputValue(titleInput, fullTitle);
			await expect(titleInput).toHaveValue(fullTitle);
		});

		// Debounced slug update (500ms) after title value settles
		await step("Wait for debounced project directory slug", async () => {
			await waitFor(
				async () => {
					await expect(projectDirInput).toHaveValue(
						"word-biblical-commentary-daniel",
					);
				},
				{ timeout: 10000, interval: 100 },
			);
		});
	},
};
