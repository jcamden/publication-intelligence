import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const pdfEditorToolbarSelectors = {
	selectTextButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Select Text"),
	drawRegionButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Draw Region"),
	typeCombobox: (canvas: StorybookCanvas) => canvas.getByRole("combobox"),
	subjectOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /subject/i }),
	pageNumberOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /page number/i }),
	excludeOption: (body: StorybookCanvas) =>
		body.getByRole("option", { name: /exclude/i }),
};
