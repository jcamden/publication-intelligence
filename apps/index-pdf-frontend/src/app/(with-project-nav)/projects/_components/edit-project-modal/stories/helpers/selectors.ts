import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const editProjectModalSelectors = {
	deleteConfirmationDeleteButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /^delete$/i }),
	deleteConfirmationInput: (body: StorybookCanvas) =>
		body.getByPlaceholderText(/type project name to confirm/i),
	deleteConfirmationPrompt: (body: StorybookCanvas) =>
		body.getByText(/are you sure you want to delete this project/i),
	deleteProjectButton: (body: StorybookCanvas) =>
		editProjectModalSelectors
			.modal(body)
			.getByRole("button", { name: /delete project/i }),
	modal: (body: StorybookCanvas) =>
		within(editProjectModalSelectors.root(body)),
	descriptionTextarea: (body: StorybookCanvas) =>
		editProjectModalSelectors
			.modal(body)
			.getByLabelText(/description \(optional\)/i),
	projectDirAlreadyInUseError: (body: StorybookCanvas) =>
		editProjectModalSelectors
			.modal(body)
			.getByText(/this project directory is already in use/i),
	projectDirInput: (body: StorybookCanvas) =>
		editProjectModalSelectors.modal(body).getByLabelText(/project directory/i),
	projectTitleInput: (body: StorybookCanvas) =>
		editProjectModalSelectors.modal(body).getByLabelText(/project title/i),
	root: (body: StorybookCanvas) =>
		body.getByRole("dialog", {
			hidden: true,
		}),
	titleAlreadyExistsError: (body: StorybookCanvas) =>
		editProjectModalSelectors
			.modal(body)
			.getByText(/a project with this title already exists/i),
};
