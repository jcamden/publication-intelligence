import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const projectFormSelectors = {
	titleInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/project title/i),
	projectDirInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/project directory/i),
	descriptionInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/description/i),
	submitCreate: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create project/i }),
	submitUpdate: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /update project/i }),
	sourceDocumentLabel: (canvas: StorybookCanvas) =>
		canvas.getByText(/source document/i),
	urlChangeHelper: (canvas: StorybookCanvas) =>
		canvas.getByText(/changing this will update the project url/i),
};
