import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

const clickableWrapper = (canvas: StorybookCanvas, label: string | RegExp) => {
	const inner = canvas.getByLabelText(label);
	const parent = inner.parentElement;
	if (!parent) {
		throw new Error("Labeled control wrapper not found");
	}
	return parent as HTMLElement;
};

export const pdfViewerToolbarSelectors = {
	clickableNextPage: (canvas: StorybookCanvas) =>
		clickableWrapper(canvas, "Next page"),
	clickablePreviousPage: (canvas: StorybookCanvas) =>
		clickableWrapper(canvas, "Previous page"),
	clickableZoomIn: (canvas: StorybookCanvas) =>
		clickableWrapper(canvas, "Zoom in"),
	clickableZoomOut: (canvas: StorybookCanvas) =>
		clickableWrapper(canvas, "Zoom out"),
	currentPageInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Current page"),
	previousPageControl: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Previous page"),
	zoomOutControl: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Zoom out"),
	zoomPercentageInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Zoom percentage"),
};
