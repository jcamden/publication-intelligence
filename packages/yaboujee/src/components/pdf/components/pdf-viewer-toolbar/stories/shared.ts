import { fn } from "@storybook/test";
import type { PdfViewerToolbarProps } from "../pdf-viewer-toolbar";

export const TOOLBAR_TEST_IDS = {
	toolbar: "pdf-viewer-toolbar",
	prevButton: "pdf-viewer-toolbar-prev",
	nextButton: "pdf-viewer-toolbar-next",
	pageInput: "pdf-viewer-toolbar-page-input",
	zoomOutButton: "pdf-viewer-toolbar-zoom-out",
	zoomInButton: "pdf-viewer-toolbar-zoom-in",
	zoomInput: "pdf-viewer-toolbar-zoom-input",
} as const;

export const defaultArgs: PdfViewerToolbarProps = {
	currentPage: 5,
	totalPages: 10,
	zoom: 1.25,
	onPageChange: fn(),
	onZoomChange: fn(),
};
