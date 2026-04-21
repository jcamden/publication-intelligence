import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfEditorToolbarSelectors = {
	drawRegionButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Draw Region"),
	excludeOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /exclude/i }),
	pageNumberOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /page number/i }),
	selectTextButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Select Text"),
	subjectOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /subject/i }),
	typeCombobox: (canvas: StorybookCanvas) => canvas.getByRole("combobox"),
};
