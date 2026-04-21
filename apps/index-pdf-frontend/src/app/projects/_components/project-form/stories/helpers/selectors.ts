import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const projectFormSelectors = {
	descriptionInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/description/i),
	projectDirInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/project directory/i),
	sourceDocumentLabel: (canvas: StorybookCanvas) =>
		canvas.getByText(/source document/i),
	submitCreate: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create project/i }),
	submitUpdate: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /update project/i }),
	titleInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/project title/i),
	urlChangeHelper: (canvas: StorybookCanvas) =>
		canvas.getByText(/changing this will update the project url/i),
};
