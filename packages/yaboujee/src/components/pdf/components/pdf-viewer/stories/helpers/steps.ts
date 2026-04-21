import type { StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { pdfViewerStorySelectors } from "./selectors";

/** Used by VRT `play` and interaction stories (no `step` wrapper). */
export const waitForPdfCanvas = async ({
	canvasElement,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	timeout?: number;
}) => {
	await waitFor(
		async () => {
			const pdfCanvas = pdfViewerStorySelectors.pdfCanvas(canvasElement);
			await expect(pdfCanvas).toBeTruthy();
		},
		{ timeout },
	);
};

/** Used by VRT and interaction stories (no `step` wrapper). */
export const waitForTextLayer = async ({
	canvasElement,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	timeout?: number;
}) => {
	await waitFor(
		async () => {
			const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
			if (!textLayer) throw new Error("Text layer not found");
			const textSpans = textLayer.querySelectorAll("span");
			if (textSpans.length === 0) throw new Error("Text layer has no spans");
		},
		{ timeout },
	);
};

export const selectAllTextInLayer = ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}) => {
	const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
	if (textLayer) {
		const range = document.createRange();
		range.selectNodeContents(textLayer);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}
};

export const selectFirstTextSpan = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	await waitForTextLayer({ canvasElement });
	await new Promise((resolve) => setTimeout(resolve, 500));

	const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
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

	await new Promise((resolve) => setTimeout(resolve, 100));
};

export const selectAcrossMultipleSpans = async ({
	canvasElement,
	spanCount = 2,
}: {
	canvasElement: HTMLElement;
	spanCount?: number;
}): Promise<void> => {
	if (spanCount < 2) {
		throw new Error("spanCount must be at least 2 for multi-line selection");
	}

	await waitForTextLayer({ canvasElement });
	await new Promise((resolve) => setTimeout(resolve, 500));

	const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
	if (!textLayer) {
		throw new Error("Text layer not found");
	}

	const textSpans = textLayer.querySelectorAll("span");
	if (textSpans.length < spanCount) {
		throw new Error(
			`Not enough text spans: need ${spanCount}, found ${textSpans.length}`,
		);
	}

	const range = document.createRange();
	range.setStart(textSpans[0].firstChild || textSpans[0], 0);
	range.setEnd(
		textSpans[spanCount - 1].firstChild || textSpans[spanCount - 1],
		textSpans[spanCount - 1].textContent?.length || 1,
	);

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	await new Promise((resolve) => setTimeout(resolve, 100));
};

export const pdfCanvasAppears = async ({
	canvasElement,
	step,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("PDF canvas element is present", async () => {
		await waitForPdfCanvas({ canvasElement, timeout });
	});
};

export const pdfCanvasWidthGreaterThan = async ({
	canvasElement,
	step,
	minWidth,
	timeout = 5000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	minWidth: number;
	timeout?: number;
}) => {
	await step(`PDF canvas width is greater than ${minWidth}`, async () => {
		await waitFor(
			async () => {
				const pdfCanvas = pdfViewerStorySelectors.pdfCanvas(canvasElement);
				await expect(pdfCanvas).toBeTruthy();
				if (pdfCanvas) {
					await expect(pdfCanvas.width).toBeGreaterThan(minWidth);
				}
			},
			{ timeout },
		);
	});
};

export const errorLoadingPdfHeadingAppears = async ({
	canvasElement,
	step,
	timeout = 5000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Error loading PDF message is present", async () => {
		await waitFor(
			async () => {
				const heading = pdfViewerStorySelectors.errorLoadingPdf(canvasElement);
				await expect(heading).toBeTruthy();
			},
			{ timeout },
		);
	});
};

export const textLayerHasSpans = async ({
	canvasElement,
	step,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Text layer has at least one span", async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
				await expect(textLayer).toBeTruthy();
				const textSpans = textLayer?.querySelectorAll("span");
				await expect(textSpans?.length).toBeGreaterThan(0);
			},
			{ timeout },
		);
	});
};

export const textLayerBoundingBoxMatchesCanvas = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Text layer size matches PDF canvas pixel size", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(
			canvasElement,
		) as HTMLElement | null;
		const pdfCanvas = pdfViewerStorySelectors.pdfCanvas(canvasElement);

		await expect(textLayer).toBeTruthy();
		await expect(pdfCanvas).toBeTruthy();

		if (textLayer && pdfCanvas) {
			const textLayerWidth = textLayer.getBoundingClientRect().width;
			const textLayerHeight = textLayer.getBoundingClientRect().height;

			await expect(Math.round(textLayerWidth)).toBe(pdfCanvas.width);
			await expect(Math.round(textLayerHeight)).toBe(pdfCanvas.height);
		}
	});
};

export const textLayerScaleFactorCssIs = async ({
	canvasElement,
	step,
	expected,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	expected: string;
}) => {
	await step(`Text layer --scale-factor is ${expected}`, async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(
			canvasElement,
		) as HTMLElement | null;

		if (textLayer) {
			const scaleValue = textLayer.style.getPropertyValue("--scale-factor");
			await expect(scaleValue).toBe(expected);
		}
	});
};

export const textLayerScaleFactorCssBecomes = async ({
	canvasElement,
	step,
	expected,
	timeout = 5000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	expected: string;
	timeout?: number;
}) => {
	await step(`Text layer --scale-factor becomes ${expected}`, async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(
					canvasElement,
				) as HTMLElement | null;
				const scaleValue = textLayer?.style.getPropertyValue("--scale-factor");
				await expect(scaleValue).toBe(expected);
			},
			{ timeout },
		);
	});
};

export const textLayerIsAbsent = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Text layer is not in the DOM", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
		await expect(textLayer).toBeFalsy();
	});
};

export const highlightRoleButtonCountIs = async ({
	canvasElement,
	step,
	expected,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	expected: number;
	timeout?: number;
}) => {
	await step(`Highlight control count is ${expected}`, async () => {
		await waitFor(
			async () => {
				const buttons =
					pdfViewerStorySelectors.highlightRoleButtons(canvasElement);
				await expect(buttons.length).toBe(expected);
			},
			{ timeout },
		);
	});
};

export const highlightRoleButtonCountIsAtLeast = async ({
	canvasElement,
	step,
	min,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	min: number;
	timeout?: number;
}) => {
	await step(`Highlight control count is at least ${min}`, async () => {
		await waitFor(
			async () => {
				const buttons =
					pdfViewerStorySelectors.highlightRoleButtons(canvasElement);
				await expect(buttons.length).toBeGreaterThanOrEqual(min);
			},
			{ timeout },
		);
	});
};

export const textLayerThenHighlightsReady = async ({
	canvasElement,
	step,
	expectedHighlightCount,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	expectedHighlightCount: number;
	timeout?: number;
}) => {
	await step("Text layer has spans", async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
				await expect(textLayer).toBeTruthy();
				const textSpans = textLayer?.querySelectorAll("span");
				await expect(textSpans?.length).toBeGreaterThan(0);
			},
			{ timeout },
		);
	});

	await step("Highlight controls match expected count", async () => {
		await waitFor(
			async () => {
				const buttons =
					pdfViewerStorySelectors.highlightRoleButtons(canvasElement);
				await expect(buttons.length).toBe(expectedHighlightCount);
			},
			{ timeout },
		);
	});
};

export const clickHighlightCenterAndSeeClickedLabel = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Click center highlight", async () => {
		const centerHighlight = pdfViewerStorySelectors.highlightByTestId(
			canvasElement,
			"highlight-center",
		);
		await expect(centerHighlight).toBeTruthy();
		await userEvent.click(centerHighlight);
	});

	await step("Clicked label text appears", async () => {
		const storyCanvas = within(canvasElement);
		await waitFor(
			async () => {
				const successMessage = storyCanvas.queryByText(/Clicked: Center/i);
				await expect(successMessage).toBeTruthy();
			},
			{ timeout: 2000 },
		);
	});
};

export const firstHighlightWrapperPointerEventsNotNone = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step(
		"First highlight wrapper does not use pointer-events none",
		async () => {
			const canvas = within(canvasElement);
			const highlights = canvas.getAllByRole("button");
			const firstHighlight = highlights[0] as HTMLElement;
			const parentElement = firstHighlight.parentElement;
			if (!parentElement) {
				throw new Error("Highlight parent element not found");
			}
			const pointerEvents =
				window.getComputedStyle(parentElement).pointerEvents;
			await expect(pointerEvents).not.toBe("none");
		},
	);
};

export const textLayerPointerEventsIsAuto = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Text layer pointer-events is auto", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(
			canvasElement,
		) as HTMLElement;
		const pointerEvents = window.getComputedStyle(textLayer).pointerEvents;
		await expect(pointerEvents).toBe("auto");
	});
};

export const highlightLayerPointerEventsIsNone = async ({
	canvasElement,
	step,
	timeout = 5000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Highlight layer uses pointer-events none", async () => {
		await waitFor(
			async () => {
				const canvas = within(canvasElement);
				const highlights = canvas.queryAllByRole("button");
				await expect(highlights.length).toBeGreaterThan(0);
			},
			{ timeout },
		);

		const canvas = within(canvasElement);
		const highlights = canvas.getAllByRole("button");
		const highlightLayer = highlights[0].parentElement as HTMLElement;
		const pointerEvents = window.getComputedStyle(highlightLayer).pointerEvents;
		await expect(pointerEvents).toBe("none");
	});
};

export const selectFirstSpanTextAndDispatchMouseUpOnDocument = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step(
		"Select first text span and dispatch mouseup on document",
		async () => {
			const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
			if (textLayer) {
				const firstSpan = textLayer.querySelector("span");
				if (firstSpan) {
					const range = document.createRange();
					range.selectNodeContents(firstSpan);
					const selection = window.getSelection();
					selection?.removeAllRanges();
					selection?.addRange(range);

					const mouseupEvent = new MouseEvent("mouseup", {
						bubbles: true,
						cancelable: true,
					});
					document.dispatchEvent(mouseupEvent);
				}
			}
		},
	);
};

export const draftHighlightAppears = async ({
	canvasElement,
	step,
	timeout = 2000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Draft highlight test id is present", async () => {
		await waitFor(
			async () => {
				const draft = pdfViewerStorySelectors.draftHighlight(canvasElement);
				await expect(draft).toBeTruthy();
			},
			{ timeout },
		);
	});
};

export const createDraftFromFirstSpanSelection = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Text layer has spans for selection", async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
				await expect(textLayer).toBeTruthy();
				const spans = textLayer?.querySelectorAll("span");
				await expect(spans?.length).toBeGreaterThan(0);
			},
			{ timeout: 10000 },
		);
	});

	await waitMs({ ms: 500, step });

	await step("Select first span and mouseup on document", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
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

		await waitMs({ ms: 100, step });

		const mouseupEvent = new MouseEvent("mouseup", { bubbles: true });
		document.dispatchEvent(mouseupEvent);
	});

	await step("Draft highlight appears", async () => {
		await waitFor(
			async () => {
				const draft = pdfViewerStorySelectors.draftHighlight(canvasElement);
				await expect(draft).toBeTruthy();
			},
			{ timeout: 3000 },
		);
	});
};

export const dispatchEscapeKeydownOnDocument = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Escape keydown is dispatched on document", async () => {
		const escapeEvent = new KeyboardEvent("keydown", {
			key: "Escape",
			bubbles: true,
		});
		document.dispatchEvent(escapeEvent);
	});

	await waitMs({ ms: 200, step });
};

export const draftHighlightIsAbsent = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Draft highlight is not in the DOM", async () => {
		const draft = pdfViewerStorySelectors.draftHighlight(canvasElement);
		await expect(draft).toBeFalsy();
	});
};

export const clickPdfCanvas = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Click PDF canvas", async () => {
		const pdfCanvas = pdfViewerStorySelectors.pdfCanvas(canvasElement);
		if (!pdfCanvas) {
			throw new Error("Canvas not found");
		}
		window.getSelection()?.removeAllRanges();
		await userEvent.click(pdfCanvas);
	});

	await waitMs({ ms: 200, step });
};

export const textLayerHasMoreThanOneSpan = async ({
	canvasElement,
	step,
	timeout = 15000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Text layer has more than one span", async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
				await expect(textLayer).toBeTruthy();
				const textSpans = textLayer?.querySelectorAll("span");
				await expect(textSpans?.length).toBeGreaterThan(1);
			},
			{ timeout },
		);
	});
};

export const selectAcrossTwoSpansAndMouseUpOnTextLayer = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await step("Select first two spans and mouseup on text layer", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
		if (!textLayer) throw new Error("Text layer not found");

		const textSpans = textLayer.querySelectorAll("span");
		if (textSpans.length < 2)
			throw new Error(`Not enough text spans: found ${textSpans.length}`);

		const range = document.createRange();
		range.setStart(textSpans[0].firstChild || textSpans[0], 0);
		range.setEnd(textSpans[1].firstChild || textSpans[1], 1);

		const selection = window.getSelection();
		if (selection) {
			selection.removeAllRanges();
			selection.addRange(range);
		}

		const mouseUpEvent = new MouseEvent("mouseup", { bubbles: true });
		textLayer.dispatchEvent(mouseUpEvent);

		await waitMs({ ms: 100, step });
	});
};

export const customPopoverAppears = async ({
	step,
	timeout = 2000,
}: {
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Custom popover test id is present", async () => {
		await waitFor(
			async () => {
				const customPopover = pdfViewerStorySelectors.customPopover();
				await expect(customPopover).toBeTruthy();
			},
			{ timeout },
		);
	});
};

export const clickConfirmInCustomPopover = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Confirm in custom popover", async () => {
		const confirmButton = pdfViewerStorySelectors.confirmInCustomPopover();
		await userEvent.click(confirmButton);
	});
};

export const confirmedResultAppears = async ({
	canvasElement,
	step,
	timeout = 2000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Confirmed result test id is present", async () => {
		await waitFor(
			async () => {
				const result = pdfViewerStorySelectors.confirmedResult(canvasElement);
				await expect(result).toBeTruthy();
			},
			{ timeout },
		);
	});
};

export const textLayerHasMoreThanFiveSpans = async ({
	canvasElement,
	step,
	timeout = 10000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Text layer has more than five spans", async () => {
		await waitFor(
			async () => {
				const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
				await expect(textLayer).toBeTruthy();
				const textSpans = textLayer?.querySelectorAll("span");
				await expect(textSpans?.length).toBeGreaterThan(5);
			},
			{ timeout },
		);
	});
};

export const selectFiveSpansAndMouseUpOnDocument = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
}) => {
	await waitMs({ ms: 1000, step });

	await step("Select across five spans and mouseup on document", async () => {
		const textLayer = pdfViewerStorySelectors.textLayer(canvasElement);
		if (!textLayer) throw new Error("Text layer not found");

		const textSpans = textLayer.querySelectorAll("span");
		if (textSpans.length < 5) {
			throw new Error(
				`Not enough text spans: need 5, found ${textSpans.length}`,
			);
		}

		const range = document.createRange();
		range.setStart(textSpans[0].firstChild || textSpans[0], 0);
		const lastSpan = textSpans[4];
		const textLength = lastSpan.textContent?.length || 1;
		range.setEnd(
			lastSpan.firstChild || lastSpan,
			Math.max(1, Math.floor(textLength / 2)),
		);

		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);

		await waitMs({ ms: 100, step });

		const mouseupEvent = new MouseEvent("mouseup", {
			bubbles: true,
			cancelable: true,
		});
		document.dispatchEvent(mouseupEvent);

		await waitMs({ ms: 200, step });
	});
};

export const draftHighlightBoxesExistInLayer = async ({
	canvasElement,
	step,
	timeout = 3000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Draft highlight nodes exist under highlight layer", async () => {
		await waitFor(
			async () => {
				const highlightLayer =
					pdfViewerStorySelectors.highlightLayer(canvasElement);
				const draftHighlights = highlightLayer.querySelectorAll(
					"[data-testid='highlight-draft']",
				);
				await expect(draftHighlights.length).toBeGreaterThan(0);
			},
			{ timeout },
		);
	});
};

export const draftDataShowsMultipleBboxes = async ({
	canvasElement,
	step,
	timeout = 2000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Draft data reports multiple bboxes", async () => {
		await waitFor(
			async () => {
				const draftDataElement =
					pdfViewerStorySelectors.draftData(canvasElement);
				await expect(draftDataElement).toBeTruthy();

				const bboxCount = draftDataElement?.getAttribute("data-bbox-count");
				const count = Number(bboxCount);
				await expect(count).toBeGreaterThanOrEqual(2);
			},
			{ timeout },
		);
	});
};

export const multipleDraftHighlightBoxesRendered = async ({
	canvasElement,
	step,
	timeout = 3000,
}: {
	canvasElement: HTMLElement;
	step: StoryStep;
	timeout?: number;
}) => {
	await step("Multiple draft highlight boxes render", async () => {
		await waitFor(
			async () => {
				const highlightLayer =
					pdfViewerStorySelectors.highlightLayer(canvasElement);
				const draftHighlights = highlightLayer.querySelectorAll(
					"[data-testid='highlight-draft']",
				);
				await expect(draftHighlights.length).toBeGreaterThanOrEqual(2);
			},
			{ timeout },
		);
	});
};
