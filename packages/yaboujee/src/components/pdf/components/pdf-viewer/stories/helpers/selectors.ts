import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

type StoryRoot = HTMLElement;

export type PdfViewerStorySelectors = {
	confirmInCustomPopover: () => HTMLElement;
	confirmedResult: (root: StoryRoot) => HTMLElement | null;
	customPopover: () => HTMLElement | null;
	draftData: (root: StoryRoot) => HTMLElement | null;
	draftHighlight: (root: StoryRoot) => HTMLElement | null;
	errorLoadingPdf: (root: StoryRoot) => HTMLElement | null;
	highlightByTestId: (root: StoryRoot, testId: string) => HTMLElement;
	highlightLayer: (root: StoryRoot) => HTMLElement;
	highlightRoleButtons: (root: StoryRoot) => HTMLElement[];
	pdfCanvas: (root: StoryRoot) => HTMLCanvasElement | null;
	storyCanvas: (root: StoryRoot) => StorybookCanvas;
	textLayer: (root: StoryRoot) => HTMLElement | null;
};

export const pdfViewerStorySelectors: PdfViewerStorySelectors = {
	confirmInCustomPopover: () =>
		within(document.body).getByRole("button", { name: "Confirm" }),

	confirmedResult: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("confirmed-result"),

	customPopover: () => within(document.body).queryByTestId("custom-popover"),

	draftData: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("draft-data"),

	draftHighlight: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("highlight-draft"),

	errorLoadingPdf: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByText(/Error Loading PDF/i),

	highlightByTestId: (root: HTMLElement, testId: string) =>
		pdfViewerStorySelectors.storyCanvas(root).getByTestId(testId),

	highlightLayer: (root: HTMLElement) =>
		pdfViewerStorySelectors
			.storyCanvas(root)
			.getByTestId("pdf-highlight-layer"),

	highlightRoleButtons: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryAllByRole("button"),

	pdfCanvas: (root: HTMLElement) => root.querySelector("canvas"),

	storyCanvas: (root: HTMLElement) => within(root),

	textLayer: (root: HTMLElement) => root.querySelector(".textLayer"),
};
