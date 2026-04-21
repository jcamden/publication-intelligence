import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const createProjectModalSelectors = {
	modal: (body: StorybookCanvas) =>
		within(createProjectModalSelectors.root(body)),
	projectDirAlreadyInUseError: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByText(/this project directory is already in use/i),
	projectDirInput: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByLabelText(/project directory/i),
	projectTitleAlreadyExistsError: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByText(/a project with this title already exists/i),
	root: (body: StorybookCanvas) =>
		body.getByRole("dialog", {
			hidden: true,
			name: /create new project/i,
		}),
	submitButton: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByRole("button", { name: /create project/i }),
	titleInput: (body: StorybookCanvas) =>
		createProjectModalSelectors.modal(body).getByLabelText(/project title/i),
};
