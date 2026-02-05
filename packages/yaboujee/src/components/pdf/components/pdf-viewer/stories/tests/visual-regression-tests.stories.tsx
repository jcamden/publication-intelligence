import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, waitFor } from "@storybook/test";
import { useState } from "react";
import { PdfViewer } from "../../pdf-viewer";
import {
	defaultArgs,
	mockHighlights,
	selectAcrossMultipleSpans,
} from "../shared";

export default {
	...defaultVrtMeta,
	title: "Components/PDF/PdfViewer/tests/Visual Regression Tests",
	component: PdfViewer,
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: { exclude: ["url", "scale", "className"] },
		layout: "fullscreen",
		chromatic: {
			delay: 3000,
		},
	},
} satisfies Meta<typeof PdfViewer>;

export const TextLayerDefaultScale: StoryObj<typeof PdfViewer> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.5}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
				textLayerInteractive={true}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		await waitFor(
			async () => {
				const textLayer = canvasElement.querySelector(".textLayer");
				if (!textLayer) throw new Error("Text layer not found");
				const textSpans = textLayer.querySelectorAll("span");
				if (textSpans.length === 0) throw new Error("Text layer has no spans");
			},
			{ timeout: 15000 },
		);

		// Programmatically select all text
		const textLayer = canvasElement.querySelector(".textLayer") as HTMLElement;
		if (textLayer) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(textLayer);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const TextLayerDisabled: StoryObj<typeof PdfViewer> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.5}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={false}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		await waitFor(
			async () => {
				const canvas = canvasElement.querySelector("canvas");
				if (!canvas) throw new Error("Canvas not found");
			},
			{ timeout: 5000 },
		);

		// Attempt to select all text (should not work since text layer is disabled)
		const selection = window.getSelection();
		selection?.removeAllRanges();

		// Try to create a range on the canvas element
		const canvas = canvasElement.querySelector("canvas") as HTMLElement;
		if (canvas) {
			try {
				const range = document.createRange();
				range.selectNodeContents(canvas);
				selection?.addRange(range);
			} catch (_e) {
				// Expected - canvas has no selectable text
			}
		}

		// Small delay for visual confirmation that nothing is selected
		await new Promise((resolve) => setTimeout(resolve, 200));
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const WithHighlightsLargeScale: StoryObj<typeof PdfViewer> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				onHighlightClick={fn()}
			/>
		);
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const HighlightsLayeredAboveTextLayerHover: StoryObj<typeof PdfViewer> =
	{
		globals: {
			...defaultGlobals,
			viewport: { value: "mobile1" },
		},
		render: () => {
			const [page, setPage] = useState(1);
			const [_numPages, setNumPages] = useState(0);

			return (
				<PdfViewer
					url={defaultArgs.url}
					scale={0.5}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
					highlights={mockHighlights}
					onHighlightClick={fn()}
					showTextLayer={true}
					textLayerInteractive={false}
				/>
			);
		},
		parameters: {
			theme: "light",
			chromatic: {
				delay: 3000,
			},
		},
		play: async ({ canvasElement }) => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(".textLayer");
					if (!textLayer) throw new Error("Text layer not found");
					const textSpans = textLayer.querySelectorAll("span");
					if (textSpans.length === 0)
						throw new Error("Text layer has no spans");
				},
				{ timeout: 5000 },
			);

			await waitFor(
				async () => {
					const centerHighlight = canvasElement.querySelector(
						'[data-testid="highlight-center"]',
					);
					if (!centerHighlight) throw new Error("Center highlight not found");
				},
				{ timeout: 5000 },
			);

			// Hover the center highlight to verify it's on top and interactive
			const centerHighlight = canvasElement.querySelector(
				'[data-testid="highlight-center"]',
			);
			if (centerHighlight) {
				centerHighlight.classList.add("pseudo-hover");
			}

			await new Promise((resolve) => setTimeout(resolve, 500));
		},
	};

// Phase 3: Draft highlight visual tests

export const DraftRegionHighlight: StoryObj<typeof PdfViewer> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		const highlightsWithDraft = [
			...mockHighlights,
			{
				id: "draft",
				pageNumber: 1,
				label: "Draft Region",
				text: "", // No text for region
				bboxes: [{ x: 250, y: 250, width: 150, height: 100 }],
				metadata: { isDraft: true },
			},
		];

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.5}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={highlightsWithDraft}
				regionDrawingActive={true}
				onHighlightClick={fn()}
			/>
		);
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const MultiLineDraftHighlight: StoryObj<typeof PdfViewer> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.5}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				showTextLayer={true}
				textLayerInteractive={true}
				onCreateDraftHighlight={fn()}
				onHighlightClick={fn()}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		// Wait for text layer to render
		await waitFor(
			async () => {
				const textLayer = canvasElement.querySelector(".textLayer");
				const textSpans = textLayer?.querySelectorAll("span");
				if (!textSpans || textSpans.length < 5) {
					throw new Error("Text layer not ready or not enough spans");
				}
			},
			{ timeout: 10000 },
		);

		// Select across multiple spans to create multi-bbox draft
		await selectAcrossMultipleSpans({ canvasElement, spanCount: 5 });

		// Trigger mouseup to create draft
		const mouseupEvent = new MouseEvent("mouseup", {
			bubbles: true,
			cancelable: true,
		});
		document.dispatchEvent(mouseupEvent);

		// Wait for draft to be created and rendered
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
	parameters: {
		chromatic: {
			delay: 500,
		},
	},
};
