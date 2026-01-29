import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import { useState } from "react";
import { PdfViewer } from "../../pdf-viewer";
import { defaultArgs } from "../shared";

export default {
	title: "Components/PdfViewer/tests/Interaction Tests",
	component: PdfViewer,
	tags: ["interaction-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["url", "scale", "className"],
		},
		layout: "fullscreen",
	},
} satisfies Meta<typeof PdfViewer>;

export const LoadsAndDisplaysPdf: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={defaultArgs.scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Wait for PDF canvas to be rendered
		await waitFor(
			async () => {
				const pdfCanvas =
					canvas.queryByRole("img", { hidden: true }) ||
					canvasElement.querySelector("canvas");
				await expect(pdfCanvas).toBeTruthy();
			},
			{ timeout: 5000 },
		);
	},
};

export const RendersAtDifferentScales: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const [scale, _setScale] = useState(2.0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		// Wait for PDF canvas to be rendered
		await waitFor(
			async () => {
				const pdfCanvas = canvasElement.querySelector("canvas");
				await expect(pdfCanvas).toBeTruthy();
				// At 2.0 scale, canvas should be larger
				if (pdfCanvas) {
					await expect(pdfCanvas.width).toBeGreaterThan(500);
				}
			},
			{ timeout: 5000 },
		);
	},
};

export const ShowsErrorForInvalidPdf: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url="/nonexistent.pdf"
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Wait for error message to appear
		await waitFor(
			async () => {
				const errorHeading = canvas.queryByText(/Error Loading PDF/i);
				await expect(errorHeading).toBeTruthy();
			},
			{ timeout: 5000 },
		);
	},
};
