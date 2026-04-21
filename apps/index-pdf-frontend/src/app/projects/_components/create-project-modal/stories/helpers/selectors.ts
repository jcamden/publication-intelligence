import { within } from "@storybook/test";

type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const createProjectModalSelectors = {
	root: (body: StorybookCanvas) =>
		body.getByRole("dialog", {
			name: /create new project/i,
			hidden: true,
		}),
	modal: (body: StorybookCanvas) =>
		within(createProjectModalSelectors.root(body)),
	submitButton: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByRole("button", { name: /create project/i }),
	titleInput: (body: StorybookCanvas) =>
		createProjectModalSelectors.modal(body).getByLabelText(/project title/i),
	projectDirInput: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByLabelText(/project directory/i),
	projectDirAlreadyInUseError: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByText(/this project directory is already in use/i),
	projectTitleAlreadyExistsError: (body: StorybookCanvas) =>
		createProjectModalSelectors
			.modal(body)
			.getByText(/a project with this title already exists/i),
};
