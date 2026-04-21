import { fn } from "@storybook/test";

export const defaultArgs = {
	currentPage: 5,
	totalPages: 10,
	zoom: 1.25,
	onPageChange: fn(),
	onZoomChange: fn(),
	pdfVisible: true,
	onPdfVisibilityToggle: fn(),
	showPdfToggle: true,
	activeAction: { type: null, indexType: null } as const,
	selectedType: "page_number",
	onSelectText: fn(),
	onDrawRegion: fn(),
	onHighlightInteraction: fn(),
	onTypeChange: fn(),
	enabledIndexTypes: ["subject", "author", "scripture"],
};
