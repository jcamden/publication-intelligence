import type { Meta, StoryObj } from "@storybook/react";
import { fn, waitFor } from "@storybook/test";
import { useState } from "react";
import { PdfViewer } from "../../pdf-viewer";
import { defaultArgs, mockHighlights } from "../shared";

export default {
	title: "Components/PDF/PdfViewer/tests/Visual Regression Tests",
	component: PdfViewer,
	tags: ["visual-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: { exclude: ["url", "scale", "className"] },
		layout: "fullscreen",
		chromatic: {
			delay: 3000,
		},
	},
} satisfies Meta<typeof PdfViewer>;

export const DefaultLight: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
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
	parameters: {
		theme: "light",
	},
};

export const DefaultDark: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
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
	parameters: {
		backgrounds: { default: "dark" },
		theme: "dark",
	},
};

export const TextLayerDefaultScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
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
			{ timeout: 5000 },
		);

		const textLayer = canvasElement.querySelector(".textLayer");
		if (textLayer) {
			const range = document.createRange();
			range.selectNodeContents(textLayer);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const TextLayerSmallScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.75}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
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
			{ timeout: 5000 },
		);

		const textLayer = canvasElement.querySelector(".textLayer");
		if (textLayer) {
			const range = document.createRange();
			range.selectNodeContents(textLayer);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const TextLayerLargeScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={2.0}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
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
			{ timeout: 5000 },
		);

		const textLayer = canvasElement.querySelector(".textLayer");
		if (textLayer) {
			const range = document.createRange();
			range.selectNodeContents(textLayer);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	},
	parameters: {
		theme: "light",
		chromatic: {
			delay: 3000,
		},
	},
};

export const TextLayerDefaultScaleDark: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
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
			{ timeout: 5000 },
		);

		const textLayer = canvasElement.querySelector(".textLayer");
		if (textLayer) {
			const range = document.createRange();
			range.selectNodeContents(textLayer);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	},
	parameters: {
		backgrounds: { default: "dark" },
		theme: "dark",
		chromatic: {
			delay: 3000,
		},
	},
};

export const TextLayerDisabled: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={false}
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

export const WithHighlightsDefaultScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
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

export const WithHighlightsSmallScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={0.75}
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

export const WithHighlightsLargeScale: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={2.0}
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

export const WithHighlightsDark: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				onHighlightClick={fn()}
			/>
		);
	},
	parameters: {
		backgrounds: { default: "dark" },
		theme: "dark",
		chromatic: {
			delay: 3000,
		},
	},
};

export const WithHighlightsHoverState: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
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
	},
	play: async ({ canvasElement }) => {
		// Wait for PDF canvas to render
		await waitFor(
			() => {
				const canvas = canvasElement.querySelector("canvas");
				if (!canvas) throw new Error("Canvas not found");
			},
			{ timeout: 10000 },
		);

		// Wait for highlights to render
		await waitFor(
			() => {
				const highlight = canvasElement.querySelector(
					'[data-testid="highlight-top-left"]',
				);
				if (!highlight) throw new Error("Highlight not found");
			},
			{ timeout: 5000 },
		);

		// Manually apply pseudo-hover class after element exists
		const highlightElement = canvasElement.querySelector(
			'[data-testid="highlight-top-left"]',
		);
		if (highlightElement) {
			highlightElement.classList.add("pseudo-hover");
		}

		// Wait for CSS transitions to complete
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};

export const WithHighlightsHoverStateDark: StoryObj<typeof PdfViewer> = {
	globals: {
		viewport: undefined,
	},
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				onHighlightClick={fn()}
			/>
		);
	},
	parameters: {
		backgrounds: { default: "dark" },
		theme: "dark",
	},
	play: async ({ canvasElement }) => {
		// Wait for PDF canvas to render
		await waitFor(
			() => {
				const canvas = canvasElement.querySelector("canvas");
				if (!canvas) throw new Error("Canvas not found");
			},
			{ timeout: 10000 },
		);

		// Wait for highlights to render
		await waitFor(
			() => {
				const highlight = canvasElement.querySelector(
					'[data-testid="highlight-top-left"]',
				);
				if (!highlight) throw new Error("Highlight not found");
			},
			{ timeout: 5000 },
		);

		// Manually apply pseudo-hover class after element exists
		const highlightElement = canvasElement.querySelector(
			'[data-testid="highlight-top-left"]',
		);
		if (highlightElement) {
			highlightElement.classList.add("pseudo-hover");
		}

		// Wait for CSS transitions to complete
		await new Promise((resolve) => setTimeout(resolve, 500));
	},
};
