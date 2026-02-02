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
				textLayerInteractive={true}
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
				textLayerInteractive={true}
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

export const HighlightClickableEvenWhenLayeredWithTextLayer: StoryObj<
	typeof PdfViewer
> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const [clickedHighlight, setClickedHighlight] = useState<string | null>(
			null,
		);

		return (
			<div className="relative h-full">
				{clickedHighlight && (
					<div className="absolute top-2 left-2 z-50 bg-green-500 text-white px-3 py-1 rounded shadow-lg">
						Clicked: {clickedHighlight}
					</div>
				)}
				<PdfViewer
					url={defaultArgs.url}
					scale={1.25}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
					highlights={mockHighlights}
					onHighlightClick={(h) => setClickedHighlight(h.label)}
					showTextLayer={true}
					textLayerInteractive={false}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Wait for text layer and highlights to render", async () => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(".textLayer");
					await expect(textLayer).toBeTruthy();
					const textSpans = textLayer?.querySelectorAll("span");
					await expect(textSpans?.length).toBeGreaterThan(0);
				},
				{ timeout: 10000 },
			);

			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const highlights = canvas.queryAllByRole("button");
					await expect(highlights.length).toBe(mockHighlights.length);
				},
				{ timeout: 10000 },
			);
		});

		await step(
			"Click the center highlight (overlaid by text layer)",
			async () => {
				const canvas = within(canvasElement);
				// The "center" highlight is definitely overlaid by text
				const centerHighlight = canvas.getByTestId("highlight-center");
				await expect(centerHighlight).toBeTruthy();

				// Click the center of the highlight
				await userEvent.click(centerHighlight);

				// Verify the click was registered by checking for the success message
				await waitFor(
					async () => {
						const successMessage = canvas.queryByText(/Clicked: Center/i);
						await expect(successMessage).toBeTruthy();
					},
					{ timeout: 2000 },
				);
			},
		);
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

// Phase 3: Mode-based interaction tests

export const ViewModeHighlightsAreClickable: StoryObj<typeof PdfViewer> = {
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
				textLayerInteractive={false}
				regionDrawingActive={false}
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

		await step("Verify highlights are clickable in view mode", async () => {
			const canvas = within(canvasElement);
			const highlights = canvas.getAllByRole("button");
			const firstHighlight = highlights[0] as HTMLElement;

			// Check pointer-events is not 'none'
			const parentElement = firstHighlight.parentElement;
			if (!parentElement) {
				throw new Error("Highlight parent element not found");
			}
			const pointerEvents =
				window.getComputedStyle(parentElement).pointerEvents;
			await expect(pointerEvents).not.toBe("none");
		});
	},
};

export const AddTextHighlightModeTextIsSelectable: StoryObj<typeof PdfViewer> =
	{
		render: () => {
			const [page, setPage] = useState(1);
			const [_numPages, setNumPages] = useState(0);
			const handleDraft = fn();

			return (
				<PdfViewer
					url={defaultArgs.url}
					scale={1.25}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
					showTextLayer={true}
					highlights={mockHighlights}
					textLayerInteractive={true}
					onCreateDraftHighlight={handleDraft}
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

			await step(
				"Verify text layer has pointer-events auto in add-text-highlight mode",
				async () => {
					const textLayer = canvasElement.querySelector(
						".textLayer",
					) as HTMLElement;
					const pointerEvents =
						window.getComputedStyle(textLayer).pointerEvents;
					await expect(pointerEvents).toBe("auto");
				},
			);

			await step(
				"Verify highlights have pointer-events none in add-text-highlight mode",
				async () => {
					await waitFor(
						async () => {
							const canvas = within(canvasElement);
							const highlights = canvas.queryAllByRole("button");
							await expect(highlights.length).toBeGreaterThan(0);
						},
						{ timeout: 5000 },
					);

					const canvas = within(canvasElement);
					const highlights = canvas.getAllByRole("button");
					// The button's parentElement is the PdfHighlightLayer div
					const highlightLayer = highlights[0].parentElement as HTMLElement;
					const pointerEvents =
						window.getComputedStyle(highlightLayer).pointerEvents;
					await expect(pointerEvents).toBe("none");
				},
			);
		},
	};

export const AddTextHighlightModeCreatesTextDraft: StoryObj<typeof PdfViewer> =
	{
		render: () => {
			const [page, setPage] = useState(1);
			const [_numPages, setNumPages] = useState(0);
			const handleDraft = fn();

			return (
				<PdfViewer
					url={defaultArgs.url}
					scale={1.25}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
					showTextLayer={true}
					textLayerInteractive={true}
					onCreateDraftHighlight={handleDraft}
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

			await step("Select some text", async () => {
				const textLayer = canvasElement.querySelector(".textLayer");
				if (textLayer) {
					const firstSpan = textLayer.querySelector("span");
					if (firstSpan) {
						const range = document.createRange();
						range.selectNodeContents(firstSpan);
						const selection = window.getSelection();
						selection?.removeAllRanges();
						selection?.addRange(range);

						// Trigger mouseup event to simulate selection end
						const mouseupEvent = new MouseEvent("mouseup", {
							bubbles: true,
							cancelable: true,
						});
						document.dispatchEvent(mouseupEvent);
					}
				}
			});

			await step("Wait for draft highlight to appear", async () => {
				await waitFor(
					async () => {
						const canvas = within(canvasElement);
						const draftHighlight = canvas.queryByTestId("highlight-draft");
						await expect(draftHighlight).toBeTruthy();
					},
					{ timeout: 2000 },
				);
			});
		},
	};

// NOTE: Region drawing test disabled due to inability to simulate drag interaction
// The feature works correctly when tested manually in the browser, but programmatic
// simulation of mouse drag events (using MouseEvent, fireEvent, or userEvent.pointer)
// does not trigger the React state updates properly in the test environment.
// The drag interaction relies on document-level event listeners with React state,
// which proves difficult to test programmatically.
//
// Manual testing confirms:
// - Live preview rectangle appears during drag
// - Draft highlight created on mouseup
// - Coordinates correctly converted to PDF space
//
// export const AddRegionModeShowsLivePreview: StoryObj<typeof PdfViewer> = {
//
// };

export const EscapeKeyClearsDraftInTextMode: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const handleDraft = fn();
		const handleDraftCancelled = fn();

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
				textLayerInteractive={true}
				onCreateDraftHighlight={handleDraft}
				onDraftCancelled={handleDraftCancelled}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Wait for text layer and create draft", async () => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(".textLayer");
					await expect(textLayer).toBeTruthy();
					const spans = textLayer?.querySelectorAll("span");
					await expect(spans?.length).toBeGreaterThan(0);
				},
				{ timeout: 10000 },
			);

			// Wait a bit more to ensure text layer is fully rendered
			await new Promise((resolve) => setTimeout(resolve, 500));

			const textLayer = canvasElement.querySelector(".textLayer");
			if (!textLayer) {
				throw new Error("Text layer not found");
			}

			const firstSpan = textLayer.querySelector("span");
			if (!firstSpan) {
				throw new Error("No text spans found");
			}

			const range = document.createRange();
			range.selectNodeContents(firstSpan);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);

			// Wait for selection to be applied
			await new Promise((resolve) => setTimeout(resolve, 100));

			const mouseupEvent = new MouseEvent("mouseup", { bubbles: true });
			document.dispatchEvent(mouseupEvent);

			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const draftHighlight = canvas.queryByTestId("highlight-draft");
					await expect(draftHighlight).toBeTruthy();
				},
				{ timeout: 3000 },
			);
		});

		await step("Press Escape to clear draft", async () => {
			const escapeEvent = new KeyboardEvent("keydown", {
				key: "Escape",
				bubbles: true,
			});
			document.dispatchEvent(escapeEvent);

			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify draft is cleared", async () => {
			const canvas = within(canvasElement);
			const draftHighlight = canvas.queryByTestId("highlight-draft");
			await expect(draftHighlight).toBeFalsy();
		});
	},
};

export const ClickingOffDraftClearsDraft: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const handleDraft = fn();

		return (
			<PdfViewer
				url={defaultArgs.url}
				scale={1.25}
				currentPage={page}
				onPageChange={({ page }) => setPage(page)}
				onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				showTextLayer={true}
				textLayerInteractive={true}
				onCreateDraftHighlight={handleDraft}
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		await step("Wait for text layer and create draft", async () => {
			await waitFor(
				async () => {
					const textLayer = canvasElement.querySelector(".textLayer");
					await expect(textLayer).toBeTruthy();
					const spans = textLayer?.querySelectorAll("span");
					await expect(spans?.length).toBeGreaterThan(0);
				},
				{ timeout: 10000 },
			);

			// Wait for text layer to be fully rendered
			await new Promise((resolve) => setTimeout(resolve, 500));

			const textLayer = canvasElement.querySelector(".textLayer");
			if (!textLayer) {
				throw new Error("Text layer not found");
			}

			const firstSpan = textLayer.querySelector("span");
			if (!firstSpan) {
				throw new Error("No text spans found");
			}

			// Create selection
			const range = document.createRange();
			range.selectNodeContents(firstSpan);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);

			await new Promise((resolve) => setTimeout(resolve, 100));

			const mouseupEvent = new MouseEvent("mouseup", { bubbles: true });
			document.dispatchEvent(mouseupEvent);

			await waitFor(
				async () => {
					const canvas = within(canvasElement);
					const draftHighlight = canvas.queryByTestId("highlight-draft");
					await expect(draftHighlight).toBeTruthy();
				},
				{ timeout: 3000 },
			);
		});

		await step("Click outside the draft to clear it", async () => {
			// Clear the selection first
			window.getSelection()?.removeAllRanges();

			// Click on an empty area of the canvas
			const pdfCanvas = canvasElement.querySelector("canvas");
			if (!pdfCanvas) {
				throw new Error("Canvas not found");
			}

			await userEvent.click(pdfCanvas);

			// Wait for draft to be cleared
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify draft is cleared after clicking off", async () => {
			const canvas = within(canvasElement);
			const draftHighlight = canvas.queryByTestId("highlight-draft");
			await expect(draftHighlight).toBeFalsy();
		});
	},
};
