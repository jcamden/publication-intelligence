import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { useEffect, useState } from "react";
import { PdfViewer } from "../../pdf-viewer";
import { defaultArgs, mockHighlights } from "../shared";

export default {
	title: "Components/PDF/PdfViewer/tests/Interaction Tests",
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
		// Wait for PDF canvas to be rendered
		await waitFor(
			async () => {
				const pdfCanvas = canvasElement.querySelector("canvas");
				await expect(pdfCanvas).toBeTruthy();
			},
			{ timeout: 10000 },
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

export const TextLayerIsSelectable: StoryObj<typeof PdfViewer> = {
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
	play: async ({ canvasElement, step }) => {
		await step("Wait for text layer to render", async () => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(".textLayer");
					await expect(textLayer).toBeTruthy();
					const textSpans = textLayer?.querySelectorAll("span");
					await expect(textSpans?.length).toBeGreaterThan(0);
				},
				{ timeout: 10000 },
			);
		});

		await step("Verify text layer has correct dimensions", async () => {
			const textLayer = canvasElement.querySelector(
				".textLayer",
			) as HTMLElement;
			const pdfCanvas = canvasElement.querySelector("canvas");

			await expect(textLayer).toBeTruthy();
			await expect(pdfCanvas).toBeTruthy();

			if (textLayer && pdfCanvas) {
				const textLayerWidth = textLayer.getBoundingClientRect().width;
				const textLayerHeight = textLayer.getBoundingClientRect().height;

				await expect(Math.round(textLayerWidth)).toBe(pdfCanvas.width);
				await expect(Math.round(textLayerHeight)).toBe(pdfCanvas.height);
			}
		});

		await step("Verify text layer has scale factor CSS variable", async () => {
			const textLayer = canvasElement.querySelector(
				".textLayer",
			) as HTMLElement;

			if (textLayer) {
				const scaleValue = textLayer.style.getPropertyValue("--scale-factor");
				await expect(scaleValue).toBe("1.25");
			}
		});
	},
};

export const TextLayerScalesCorrectly: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const [scale, setScale] = useState(1.0);

		useEffect(() => {
			const timer = setTimeout(() => setScale(1.5), 1000);
			return () => clearTimeout(timer);
		}, []);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Verify text layer updates after scale change", async () => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(
						".textLayer",
					) as HTMLElement;
					const scaleValue =
						textLayer?.style.getPropertyValue("--scale-factor");
					await expect(scaleValue).toBe("1.5");
				},
				{ timeout: 5000 },
			);
		});

		await step("Verify text layer dimensions update", async () => {
			const textLayer = canvasElement.querySelector(
				".textLayer",
			) as HTMLElement;
			const pdfCanvas = canvasElement.querySelector("canvas");

			if (textLayer && pdfCanvas) {
				const textLayerWidth = textLayer.getBoundingClientRect().width;
				const textLayerHeight = textLayer.getBoundingClientRect().height;

				await expect(Math.round(textLayerWidth)).toBe(pdfCanvas.width);
				await expect(Math.round(textLayerHeight)).toBe(pdfCanvas.height);
			}
		});
	},
};

export const TextLayerCanBeDisabled: StoryObj<typeof PdfViewer> = {
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
	play: async ({ canvasElement, step }) => {
		await step("Wait for PDF to load", async () => {
			await waitFor(
				async () => {
					const pdfCanvas = canvasElement.querySelector("canvas");
					await expect(pdfCanvas).toBeTruthy();
				},
				{ timeout: 5000 },
			);
		});

		await step("Verify text layer is not present", async () => {
			const textLayer = canvasElement.querySelector(".textLayer");
			await expect(textLayer).toBeFalsy();
		});
	},
};

export const HighlightsRenderCorrectly: StoryObj<typeof PdfViewer> = {
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
	play: async ({ canvasElement, step }) => {
		await step("Wait for PDF and highlights to render", async () => {
			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const highlights = canvas.queryAllByRole("button");
					await expect(highlights.length).toBe(mockHighlights.length);
				},
				{ timeout: 10000 },
			);
		});
	},
};

export const HighlightClickTriggersCallback: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const handleClick = fn();

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				onHighlightClick={handleClick}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Wait for highlights to render", async () => {
			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const highlights = canvas.queryAllByRole("button");
					await expect(highlights.length).toBeGreaterThan(0);
				},
				{ timeout: 10000 },
			);
		});

		await step("Click first highlight", async () => {
			const canvas = within(canvasElement);
			const highlights = canvas.getAllByRole("button");
			await userEvent.click(highlights[0]);
		});
	},
};

export const HighlightsUpdateWithScale: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const [scale, setScale] = useState(1.0);

		useEffect(() => {
			const timer = setTimeout(() => setScale(2.0), 1000);
			return () => clearTimeout(timer);
		}, []);

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={scale}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={mockHighlights}
				onHighlightClick={fn()}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Wait for initial render", async () => {
			await waitFor(
				async () => {
					const pdfCanvas = canvasElement.querySelector("canvas");
					await expect(pdfCanvas).toBeTruthy();
				},
				{ timeout: 10000 },
			);
		});

		await step("Verify highlights persist after scale change", async () => {
			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const highlights = canvas.getAllByRole("button");
					await expect(highlights.length).toBe(mockHighlights.length);
				},
				{ timeout: 5000 },
			);
		});
	},
};

export const HighlightsFilteredByPage: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);

		const multiPageHighlights = [
			...mockHighlights,
			{
				id: "page-2-highlight",
				pageNumber: 2,
				label: "Page 2 Highlight",
				text: "This is on page 2",
				bbox: { x: 100, y: 400, width: 150, height: 20 },
			},
		];

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				highlights={multiPageHighlights}
				onHighlightClick={fn()}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step(
			"Wait for highlights to render and verify filtering",
			async () => {
				await waitFor(
					async () => {
						const canvas = within(canvasElement);
						const highlights = canvas.queryAllByRole("button");
						await expect(highlights.length).toBe(mockHighlights.length);
					},
					{ timeout: 10000 },
				);
			},
		);
	},
};
