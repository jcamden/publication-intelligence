import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

type StoryRoot = HTMLElement;

export type PdfViewerStorySelectors = {
	storyCanvas: (root: StoryRoot) => StorybookCanvas;
	pdfCanvas: (root: StoryRoot) => HTMLCanvasElement | null;
	textLayer: (root: StoryRoot) => HTMLElement | null;
	draftHighlight: (root: StoryRoot) => HTMLElement | null;
	highlightLayer: (root: StoryRoot) => HTMLElement;
	highlightByTestId: (root: StoryRoot, testId: string) => HTMLElement;
	errorLoadingPdf: (root: StoryRoot) => HTMLElement | null;
	highlightRoleButtons: (root: StoryRoot) => HTMLElement[];
	customPopover: () => HTMLElement | null;
	confirmInCustomPopover: () => HTMLElement;
	confirmedResult: (root: StoryRoot) => HTMLElement | null;
	draftData: (root: StoryRoot) => HTMLElement | null;
};

export const pdfViewerStorySelectors: PdfViewerStorySelectors = {
	storyCanvas: (root: HTMLElement) => within(root),

	pdfCanvas: (root: HTMLElement) => root.querySelector("canvas"),

	textLayer: (root: HTMLElement) => root.querySelector(".textLayer"),

	draftHighlight: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("highlight-draft"),

	highlightLayer: (root: HTMLElement) =>
		pdfViewerStorySelectors
			.storyCanvas(root)
			.getByTestId("pdf-highlight-layer"),

	highlightByTestId: (root: HTMLElement, testId: string) =>
		pdfViewerStorySelectors.storyCanvas(root).getByTestId(testId),

	errorLoadingPdf: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByText(/Error Loading PDF/i),

	highlightRoleButtons: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryAllByRole("button"),

	customPopover: () => within(document.body).queryByTestId("custom-popover"),

	confirmInCustomPopover: () =>
		within(document.body).getByRole("button", { name: "Confirm" }),

	confirmedResult: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("confirmed-result"),

	draftData: (root: HTMLElement) =>
		pdfViewerStorySelectors.storyCanvas(root).queryByTestId("draft-data"),
};
