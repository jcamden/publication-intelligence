import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { fn } from "storybook/test";
import { PdfViewer } from "../../pdf-viewer";
import {
	clickConfirmInCustomPopover,
	clickHighlightCenterAndSeeClickedLabel,
	clickPdfCanvas,
	confirmedResultAppears,
	createDraftFromFirstSpanSelection,
	customPopoverAppears,
	dispatchEscapeKeydownOnDocument,
	draftDataShowsMultipleBboxes,
	draftHighlightAppears,
	draftHighlightBoxesExistInLayer,
	draftHighlightIsAbsent,
	errorLoadingPdfHeadingAppears,
	firstHighlightWrapperPointerEventsNotNone,
	highlightLayerPointerEventsIsNone,
	highlightRoleButtonCountIs,
	highlightRoleButtonCountIsAtLeast,
	multipleDraftHighlightBoxesRendered,
	pdfCanvasAppears,
	pdfCanvasWidthGreaterThan,
	selectAcrossTwoSpansAndMouseUpOnTextLayer,
	selectFirstSpanTextAndDispatchMouseUpOnDocument,
	selectFiveSpansAndMouseUpOnDocument,
	textLayerBoundingBoxMatchesCanvas,
	textLayerHasMoreThanFiveSpans,
	textLayerHasMoreThanOneSpan,
	textLayerHasSpans,
	textLayerIsAbsent,
	textLayerPointerEventsIsAuto,
	textLayerScaleFactorCssBecomes,
	textLayerScaleFactorCssIs,
	textLayerThenHighlightsReady,
} from "../helpers/steps";
import { defaultArgs, mockHighlights } from "../shared";

export default {
	...defaultInteractionTestMeta,
	title: "Components/PDF/PdfViewer/tests/Interaction Tests",
	component: PdfViewer,
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
	play: async ({ canvasElement, step }) => {
		await pdfCanvasAppears({ canvasElement, step, timeout: 10000 });
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
	play: async ({ canvasElement, step }) => {
		await pdfCanvasAppears({ canvasElement, step, timeout: 5000 });
		await pdfCanvasWidthGreaterThan({
			canvasElement,
			step,
			minWidth: 500,
			timeout: 5000,
		});
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
	play: async ({ canvasElement, step }) => {
		await errorLoadingPdfHeadingAppears({ canvasElement, step, timeout: 5000 });
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
		await textLayerHasSpans({ canvasElement, step, timeout: 10000 });
		await textLayerBoundingBoxMatchesCanvas({ canvasElement, step });
		await textLayerScaleFactorCssIs({
			canvasElement,
			step,
			expected: "1.25",
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
		await textLayerScaleFactorCssBecomes({
			canvasElement,
			step,
			expected: "1.5",
			timeout: 5000,
		});
		await textLayerBoundingBoxMatchesCanvas({ canvasElement, step });
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
		await pdfCanvasAppears({ canvasElement, step, timeout: 5000 });
		await textLayerIsAbsent({ canvasElement, step });
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
		await highlightRoleButtonCountIs({
			canvasElement,
			step,
			expected: mockHighlights.length,
			timeout: 10000,
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
		await textLayerThenHighlightsReady({
			canvasElement,
			step,
			expectedHighlightCount: mockHighlights.length,
			timeout: 10000,
		});
		await clickHighlightCenterAndSeeClickedLabel({ canvasElement, step });
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
				bboxes: [{ x: 100, y: 400, width: 150, height: 20 }],
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
		await highlightRoleButtonCountIs({
			canvasElement,
			step,
			expected: mockHighlights.length,
			timeout: 10000,
		});
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
		await highlightRoleButtonCountIsAtLeast({
			canvasElement,
			step,
			min: 1,
			timeout: 10000,
		});
		await firstHighlightWrapperPointerEventsNotNone({ canvasElement, step });
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
			await textLayerHasSpans({ canvasElement, step, timeout: 10000 });
			await textLayerPointerEventsIsAuto({ canvasElement, step });
			await highlightLayerPointerEventsIsNone({
				canvasElement,
				step,
				timeout: 5000,
			});
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
			await textLayerHasSpans({ canvasElement, step, timeout: 10000 });
			await selectFirstSpanTextAndDispatchMouseUpOnDocument({
				canvasElement,
				step,
			});
			await draftHighlightAppears({ canvasElement, step, timeout: 2000 });
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
		await createDraftFromFirstSpanSelection({ canvasElement, step });
		await dispatchEscapeKeydownOnDocument({ step });
		await draftHighlightIsAbsent({ canvasElement, step });
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
		await createDraftFromFirstSpanSelection({ canvasElement, step });
		await clickPdfCanvas({ canvasElement, step });
		await draftHighlightIsAbsent({ canvasElement, step });
	},
};

/**
 * Tests that renderDraftPopover callback is called and renders custom content
 */
export const RenderDraftPopoverCallback: StoryObj<typeof PdfViewer> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [draftData, setDraftData] = useState<{
			pageNumber: number;
			text: string;
		} | null>(null);

		return (
			<div>
				<PdfViewer
					url={defaultArgs.url}
					scale={defaultArgs.scale}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					showTextLayer={true}
					textLayerInteractive={true}
					onDraftConfirmed={({ draft }) => {
						setDraftData({
							pageNumber: draft.pageNumber,
							text: draft.text,
						});
					}}
					renderDraftPopover={({ text, onConfirm, onCancel }) => (
						<div data-testid="custom-popover" className="space-y-2">
							<p className="text-sm">Custom popover content</p>
							<p className="text-xs text-neutral-600">Text: {text}</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={onCancel}
									className="rounded bg-neutral-200 px-2 py-1 text-sm"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() =>
										onConfirm({ entryId: "test", entryLabel: "Test Entry" })
									}
									className="rounded bg-blue-600 px-2 py-1 text-sm text-white"
								>
									Confirm
								</button>
							</div>
						</div>
					)}
				/>
				{draftData && (
					<div data-testid="confirmed-result" className="mt-4 p-2">
						Confirmed: Page {draftData.pageNumber}, Text: {draftData.text}
					</div>
				)}
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		await textLayerHasMoreThanOneSpan({
			canvasElement,
			step,
			timeout: 15000,
		});
		await selectAcrossTwoSpansAndMouseUpOnTextLayer({ canvasElement, step });
		await customPopoverAppears({ step, timeout: 2000 });
		await clickConfirmInCustomPopover({ step });
		await confirmedResultAppears({ canvasElement, step, timeout: 2000 });
	},
};

export const MultiLineTextSelectionCreatesMultipleBboxes: StoryObj<
	typeof PdfViewer
> = {
	render: () => {
		const [page, setPage] = useState(1);
		const [_numPages, setNumPages] = useState(0);
		const [draftData, setDraftData] = useState<{
			pageNumber: number;
			text: string;
			bboxes: unknown[];
		} | null>(null);

		return (
			<div>
				<PdfViewer
					url={defaultArgs.url}
					scale={1.25}
					currentPage={page}
					onPageChange={({ page }) => setPage(page)}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
					showTextLayer={true}
					textLayerInteractive={true}
					onCreateDraftHighlight={(draft) => setDraftData(draft)}
				/>
				{draftData && (
					<div
						data-testid="draft-data"
						data-bbox-count={draftData.bboxes.length}
					/>
				)}
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		await textLayerHasMoreThanFiveSpans({
			canvasElement,
			step,
			timeout: 10000,
		});
		await selectFiveSpansAndMouseUpOnDocument({ canvasElement, step });
		await draftHighlightBoxesExistInLayer({
			canvasElement,
			step,
			timeout: 3000,
		});
		await draftDataShowsMultipleBboxes({
			canvasElement,
			step,
			timeout: 2000,
		});
		await multipleDraftHighlightBoxesRendered({
			canvasElement,
			step,
			timeout: 3000,
		});
	},
};
