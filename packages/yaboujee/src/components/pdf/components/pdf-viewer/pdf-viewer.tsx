"use client";

import { ScrollArea } from "@pubint/yabasic/components/ui/scroll-area";
import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import type {
	BoundingBox,
	PdfHighlight,
} from "../../../../types/pdf-highlight";
import { PdfHighlightLayer } from "../../../pdf-highlight-layer";
import { PdfAnnotationPopover } from "../pdf-annotation-popover";

/**
 * PDF.js Worker Configuration
 *
 * The worker file must be available in the public directory.
 * For Next.js apps: /public/pdf.worker.min.mjs
 * For Storybook: .storybook/public/pdf.worker.min.mjs
 *
 * Copy from: node_modules/pdfjs-dist/build/pdf.worker.min.mjs
 *
 * Using CDN to avoid Next.js bundling issues
 */
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

type LoadingState = "idle" | "loading" | "success" | "error";

export type PdfViewerProps = {
	url: string;
	scale?: number;
	currentPage?: number;
	onPageChange?: ({ page }: { page: number }) => void;
	onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
	className?: string;
	showTextLayer?: boolean;
	highlights?: PdfHighlight[];
	onHighlightClick?: (highlight: PdfHighlight) => void;
	/**
	 * When true, enables text selection (text layer becomes interactive).
	 * Transient activation - typically set true for one selection, then reset to false.
	 */
	textLayerInteractive?: boolean;
	/**
	 * When true, enables region drawing with click-drag (crosshair cursor).
	 * Transient activation - typically set true for one region, then reset to false.
	 */
	regionDrawingActive?: boolean;
	onCreateDraftHighlight?: (draft: {
		pageNumber: number;
		text: string;
		bboxes: BoundingBox[];
	}) => void;
	onDraftCancelled?: () => void;
	/**
	 * Called when user confirms a draft with entry information.
	 * If renderDraftPopover is provided, this should be used instead of onCreateDraftHighlight.
	 */
	onDraftConfirmed?: (data: {
		draft: {
			pageNumber: number;
			text: string;
			bboxes: BoundingBox[];
		};
		entry: {
			entryId: string;
			entryLabel: string;
			regionName?: string;
		};
	}) => void;
	/**
	 * When this value changes, clears the draft highlight.
	 * Use a counter or timestamp to trigger clearing.
	 */
	clearDraftTrigger?: number;
	/**
	 * Render function for the draft annotation popover.
	 * Called when a draft highlight exists.
	 */
	renderDraftPopover?: (draft: {
		pageNumber: number;
		text: string;
		bboxes: BoundingBox[];
		onConfirm: (data: {
			entryId: string;
			entryLabel: string;
			regionName?: string;
		}) => void;
		onCancel: () => void;
	}) => React.ReactNode;
};

/**
 * Converts a bounding box from PDF user space to DOM viewport space
 *
 * PDF user space: bottom-left origin, Y increases upward, units in points
 * DOM viewport space: top-left origin, Y increases downward, units in pixels
 */
const convertBboxToViewport = ({
	bbox,
	viewport,
}: {
	bbox: BoundingBox;
	viewport: pdfjsLib.PageViewport;
}): BoundingBox => {
	const [xA, yA, xB, yB] = viewport.convertToViewportRectangle([
		bbox.x,
		bbox.y,
		bbox.x + bbox.width,
		bbox.y + bbox.height,
	]);

	return {
		x: Math.min(xA, xB),
		y: Math.min(yA, yB),
		width: Math.abs(xA - xB),
		height: Math.abs(yA - yB),
		rotation: bbox.rotation,
	};
};

/**
 * Filters highlights for the current page and converts their bboxes to DOM coordinates
 */
const convertHighlightsForPage = ({
	highlights,
	pageNumber,
	viewport,
}: {
	highlights: PdfHighlight[];
	pageNumber: number;
	viewport: pdfjsLib.PageViewport;
}): PdfHighlight[] => {
	return highlights
		.filter((h) => h.pageNumber === pageNumber)
		.map((h) => ({
			...h,
			bboxes: (h.bboxes || []).map((bbox) =>
				convertBboxToViewport({ bbox, viewport }),
			),
		}));
};

/**
 * Converts a DOM rect (viewport space) to PDF user space
 *
 * DOM rect: relative to viewport, top-left origin, pixels
 * PDF bbox: relative to page, bottom-left origin, points
 */
const convertDomRectToPdf = ({
	domRect,
	viewport,
	pageContainer,
}: {
	domRect: DOMRect;
	viewport: pdfjsLib.PageViewport;
	pageContainer: HTMLElement;
}): BoundingBox => {
	// Get page container position
	const containerRect = pageContainer.getBoundingClientRect();

	// Convert to page-relative coordinates
	const pageX = domRect.left - containerRect.left;
	const pageY = domRect.top - containerRect.top;
	const pageX2 = domRect.right - containerRect.left;
	const pageY2 = domRect.bottom - containerRect.top;

	// Convert corners to PDF user space
	const [pdfX1, pdfY1] = viewport.convertToPdfPoint(pageX, pageY);
	const [pdfX2, pdfY2] = viewport.convertToPdfPoint(pageX2, pageY2);

	// Normalize (convertToPdfPoint can return inverted coords)
	return {
		x: Math.min(pdfX1, pdfX2),
		y: Math.min(pdfY1, pdfY2),
		width: Math.abs(pdfX2 - pdfX1),
		height: Math.abs(pdfY2 - pdfY1),
	};
};

/**
 * Converts multiple DOM rects (from wrapped text) to an array of PDF bboxes
 * Each line of selected text gets its own bounding box for accurate multi-line highlighting
 */
const convertSelectionToPdfBboxes = ({
	domRects,
	viewport,
	pageContainer,
}: {
	domRects: DOMRect[];
	viewport: pdfjsLib.PageViewport;
	pageContainer: HTMLElement;
}): BoundingBox[] => {
	if (domRects.length === 0) {
		throw new Error("No rects provided for selection");
	}

	// Filter out empty rects (browser sometimes returns zero-width/height rects at line breaks)
	// Then convert all valid rects to PDF space
	return domRects
		.filter((rect) => rect.width > 0 && rect.height > 0)
		.map((rect) =>
			convertDomRectToPdf({ domRect: rect, viewport, pageContainer }),
		);
};

/**
 * PDF Viewer Component
 *
 * A minimal PDF viewer using PDF.js that renders one page at a time.
 * Navigation controls should be provided externally (e.g., PdfViewerToolbar).
 *
 * ## Features
 * - Renders PDF pages to canvas
 * - Selectable text layer overlay (enabled by default)
 * - Highlight overlay for annotations (optional)
 * - Controlled page navigation via props
 * - Loading and error states
 * - Configurable scale/zoom
 *
 * ## Coordinate Systems
 * - `highlights` prop expects PDF user space coordinates (bottom-left origin, points)
 * - Conversion to DOM space happens automatically using viewport
 * - Each page has its own viewport (different dimensions, rotation)
 *
 * ## Usage
 * ```tsx
 * const [page, setPage] = useState(1);
 * const [zoom, setZoom] = useState(1.25);
 * const [numPages, setNumPages] = useState(0);
 *
 * <PdfViewer
 *   url="/document.pdf"
 *   scale={zoom}
 *   currentPage={page}
 *   onPageChange={({ page }) => setPage(page)}
 *   onLoadSuccess={({ numPages }) => setNumPages(numPages)}
 *   showTextLayer={true}
 *   highlights={highlights}
 *   onHighlightClick={(h) => console.log('Clicked:', h.label)}
 * />
 * ```
 *
 * ## Requirements
 * The PDF.js worker file must be available at `/pdf.worker.min.mjs` in your public directory.
 */
export const PdfViewer = ({
	url,
	scale = 1.25,
	currentPage = 1,
	onLoadSuccess,
	className = "",
	showTextLayer = true,
	highlights,
	onHighlightClick,
	textLayerInteractive = false,
	regionDrawingActive = false,
	onCreateDraftHighlight,
	onDraftCancelled,
	onDraftConfirmed,
	clearDraftTrigger,
	renderDraftPopover,
}: PdfViewerProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pageContainerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const textLayerRef = useRef<HTMLDivElement>(null);
	const textLayerInstanceRef = useRef<TextLayer | null>(null);
	const onLoadSuccessRef = useRef(onLoadSuccess);
	const [viewport, setViewport] = useState<pdfjsLib.PageViewport | null>(null);
	const [loadingState, setLoadingState] = useState<LoadingState>("idle");
	const [error, setError] = useState<string | null>(null);
	const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
	const [draftHighlight, setDraftHighlight] = useState<PdfHighlight | null>(
		null,
	);
	const [draftPopoverAnchor, setDraftPopoverAnchor] =
		useState<HTMLElement | null>(null);

	// Region drawing state (add-region mode)
	const [regionDragStart, setRegionDragStart] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [regionDragCurrent, setRegionDragCurrent] = useState<{
		x: number;
		y: number;
	} | null>(null);

	// Keep callback ref up to date
	useEffect(() => {
		onLoadSuccessRef.current = onLoadSuccess;
	}, [onLoadSuccess]);

	// Load PDF document
	useEffect(() => {
		let isCancelled = false;
		let loadedPdf: pdfjsLib.PDFDocumentProxy | null = null;

		const loadPdf = async () => {
			setLoadingState("loading");
			setError(null);

			try {
				const loadingTask = pdfjsLib.getDocument(url);
				const pdf = await loadingTask.promise;

				if (isCancelled) {
					pdf.destroy();
					return;
				}

				loadedPdf = pdf;
				setPdfDoc(pdf);
				setLoadingState("success");
				onLoadSuccessRef.current?.({ numPages: pdf.numPages });
			} catch (err) {
				if (!isCancelled) {
					setError(err instanceof Error ? err.message : "Failed to load PDF");
					setLoadingState("error");
				}
			}
		};

		loadPdf();

		return () => {
			isCancelled = true;
			if (loadedPdf) {
				loadedPdf.destroy();
			}
		};
	}, [url]);

	// Render current page
	useEffect(() => {
		if (!pdfDoc || !canvasRef.current || loadingState !== "success") {
			return;
		}

		let isCancelled = false;

		const renderPage = async () => {
			try {
				const page = await pdfDoc.getPage(currentPage);

				if (isCancelled) {
					return;
				}

				const pageViewport = page.getViewport({ scale });
				setViewport(pageViewport);

				const canvas = canvasRef.current;

				if (!canvas) {
					return;
				}

				const context = canvas.getContext("2d");
				if (!context) {
					return;
				}

				canvas.height = pageViewport.height;
				canvas.width = pageViewport.width;

				if (pageContainerRef.current) {
					pageContainerRef.current.style.width = `${pageViewport.width}px`;
					pageContainerRef.current.style.height = `${pageViewport.height}px`;
				}

				const renderContext = {
					canvasContext: context,
					viewport: pageViewport,
				};

				await page.render(renderContext).promise;

				if (isCancelled) {
					return;
				}

				if (showTextLayer && textLayerRef.current) {
					const textContent = await page.getTextContent();

					if (isCancelled) {
						return;
					}

					const textLayerDiv = textLayerRef.current;
					textLayerDiv.innerHTML = "";
					textLayerDiv.style.width = `${pageViewport.width}px`;
					textLayerDiv.style.height = `${pageViewport.height}px`;
					textLayerDiv.style.left = "0px";
					textLayerDiv.style.top = "0px";
					textLayerDiv.style.setProperty("--scale-factor", String(scale));

					const textLayer = new TextLayer({
						textContentSource: textContent,
						container: textLayerDiv,
						viewport: pageViewport,
					});

					textLayerInstanceRef.current = textLayer;
					await textLayer.render();
				}

				// Center scroll horizontally after rendering completes
				// Use requestAnimationFrame to ensure layout has been applied
				if (!isCancelled && scrollContainerRef.current) {
					requestAnimationFrame(() => {
						if (scrollContainerRef.current) {
							const container = scrollContainerRef.current;
							const scrollLeft =
								(container.scrollWidth - container.clientWidth) / 2;
							container.scrollLeft = Math.max(0, scrollLeft);
						}
					});
				}
			} catch (err) {
				if (!isCancelled) {
					setError(
						err instanceof Error ? err.message : "Failed to render page",
					);
				}
			}
		};

		renderPage();

		return () => {
			isCancelled = true;
			textLayerInstanceRef.current?.cancel();
		};
	}, [pdfDoc, currentPage, scale, loadingState, showTextLayer]);

	// Selection event handler (only active when text layer is interactive)
	useEffect(() => {
		// Only listen when text layer is interactive
		if (!textLayerInteractive) {
			return;
		}

		const handleSelectionEnd = (e: MouseEvent) => {
			if (!viewport || !pageContainerRef.current) return;

			const selection = window.getSelection();
			if (!selection || selection.isCollapsed) {
				// Don't clear draft if clicking inside the popover
				const target = e.target as HTMLElement;
				const popover = document.querySelector("[data-pdf-annotation-popover]");
				if (popover?.contains(target)) {
					return;
				}
				setDraftHighlight(null);
				return;
			}

			// Check selection belongs to text layer
			const textLayerDiv = textLayerRef.current;
			if (!textLayerDiv || !textLayerDiv.contains(selection.anchorNode)) {
				return;
			}

			const selectedText = selection.toString().trim();
			if (!selectedText) {
				setDraftHighlight(null);
				return;
			}

			// Get selection rects and convert to PDF coordinates
			const range = selection.getRangeAt(0);
			const domRects = Array.from(range.getClientRects());

			if (domRects.length === 0) return;

			try {
				// Convert to page-relative coordinates and then to PDF user space
				const pdfBboxes = convertSelectionToPdfBboxes({
					domRects,
					viewport: viewport,
					pageContainer: pageContainerRef.current,
				});

				const draft: PdfHighlight = {
					id: "draft",
					pageNumber: currentPage,
					bboxes: pdfBboxes,
					label: "Draft Selection",
					text: selectedText,
					metadata: { isDraft: true },
				};

				setDraftHighlight(draft);
				onCreateDraftHighlight?.({
					pageNumber: currentPage,
					text: selectedText,
					bboxes: pdfBboxes,
				});
			} catch (err) {
				console.error("Failed to create draft highlight:", err);
				setDraftHighlight(null);
			}
		};

		document.addEventListener("mouseup", handleSelectionEnd);

		return () => {
			document.removeEventListener("mouseup", handleSelectionEnd);
		};
	}, [textLayerInteractive, currentPage, viewport, onCreateDraftHighlight]);

	// Region drawing handlers (only active when region drawing is enabled)
	useEffect(() => {
		if (!regionDrawingActive) {
			// Clear any in-progress drag when deactivating
			setRegionDragStart(null);
			setRegionDragCurrent(null);
			return;
		}

		const handleMouseDown = (e: MouseEvent) => {
			if (!pageContainerRef.current || !viewport) return;

			// Only start drag if clicking inside the page container
			const pageContainer = pageContainerRef.current;
			const rect = pageContainer.getBoundingClientRect();
			const x = e.clientX;
			const y = e.clientY;

			if (
				x >= rect.left &&
				x <= rect.right &&
				y >= rect.top &&
				y <= rect.bottom
			) {
				// Convert to page-relative coordinates
				const pageX = x - rect.left;
				const pageY = y - rect.top;

				setRegionDragStart({ x: pageX, y: pageY });
				setRegionDragCurrent({ x: pageX, y: pageY });
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!regionDragStart || !pageContainerRef.current) return;

			const pageContainer = pageContainerRef.current;
			const rect = pageContainer.getBoundingClientRect();

			// Constrain to page bounds
			const pageX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
			const pageY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

			setRegionDragCurrent({ x: pageX, y: pageY });
		};

		const handleMouseUp = () => {
			if (
				!regionDragStart ||
				!regionDragCurrent ||
				!viewport ||
				!pageContainerRef.current
			) {
				setRegionDragStart(null);
				setRegionDragCurrent(null);
				return;
			}

			// Calculate final rectangle in DOM coordinates
			const left = Math.min(regionDragStart.x, regionDragCurrent.x);
			const top = Math.min(regionDragStart.y, regionDragCurrent.y);
			const width = Math.abs(regionDragCurrent.x - regionDragStart.x);
			const height = Math.abs(regionDragCurrent.y - regionDragStart.y);

			// Only create if drag was substantial (not just a click)
			if (width < 5 || height < 5) {
				setRegionDragStart(null);
				setRegionDragCurrent(null);
				return;
			}

			// Convert to PDF coordinates
			const pageContainer = pageContainerRef.current;
			const containerRect = pageContainer.getBoundingClientRect();
			const domRect = new DOMRect(
				left + containerRect.left,
				top + containerRect.top,
				width,
				height,
			);

			try {
				const pdfBbox = convertDomRectToPdf({
					domRect,
					viewport,
					pageContainer,
				});

				const draft: PdfHighlight = {
					id: "draft",
					pageNumber: currentPage,
					bboxes: [pdfBbox], // Region is always a single rectangle
					label: "Draft Region",
					text: "", // No text for region highlights
					metadata: { isDraft: true },
				};

				setDraftHighlight(draft);
				onCreateDraftHighlight?.({
					pageNumber: currentPage,
					text: "",
					bboxes: [pdfBbox],
				});

				// Clear drag state
				setRegionDragStart(null);
				setRegionDragCurrent(null);
			} catch (err) {
				console.error("Failed to create draft region:", err);
				setRegionDragStart(null);
				setRegionDragCurrent(null);
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		regionDrawingActive,
		regionDragStart,
		regionDragCurrent,
		viewport,
		currentPage,
		onCreateDraftHighlight,
	]);

	// Keyboard handlers
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (draftHighlight) {
					// Clear draft highlight
					setDraftHighlight(null);
					window.getSelection()?.removeAllRanges();
				}

				// Clear region drag if in progress
				if (regionDragStart || regionDragCurrent) {
					setRegionDragStart(null);
					setRegionDragCurrent(null);
				}

				// Notify parent about cancellation
				onDraftCancelled?.();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [draftHighlight, regionDragStart, regionDragCurrent, onDraftCancelled]);

	// Clear draft when clearDraftTrigger changes
	useEffect(() => {
		if (clearDraftTrigger !== undefined) {
			setDraftHighlight(null);
			setDraftPopoverAnchor(null);
			window.getSelection()?.removeAllRanges();
		}
	}, [clearDraftTrigger]);

	// Find draft highlight element for popover positioning
	useEffect(() => {
		if (!draftHighlight) {
			setDraftPopoverAnchor(null);
			return;
		}

		// Wait for draft highlight to render
		const timer = setTimeout(() => {
			const element = document.querySelector('[data-testid="highlight-draft"]');
			setDraftPopoverAnchor(element as HTMLElement | null);
		}, 50);

		return () => clearTimeout(timer);
	}, [draftHighlight]);

	// Handle draft popover confirmation
	const handleDraftConfirm = ({
		entryId,
		entryLabel,
		regionName,
	}: {
		entryId: string;
		entryLabel: string;
		regionName?: string;
	}) => {
		if (!draftHighlight) return;

		// Notify parent with complete data (draft + entry)
		onDraftConfirmed?.({
			draft: {
				pageNumber: draftHighlight.pageNumber,
				text: draftHighlight.text || "",
				bboxes: draftHighlight.bboxes,
			},
			entry: {
				entryId,
				entryLabel,
				regionName,
			},
		});

		// Clear draft
		setDraftHighlight(null);
		setDraftPopoverAnchor(null);
		window.getSelection()?.removeAllRanges();
	};

	// Handle draft popover cancellation
	const handleDraftCancel = () => {
		setDraftHighlight(null);
		setDraftPopoverAnchor(null);
		window.getSelection()?.removeAllRanges();
		onDraftCancelled?.();
	};

	const containerClasses =
		`flex h-full w-full flex-col bg-[hsl(var(--color-neutral-100))] dark:bg-[hsl(var(--color-neutral-900))] ${className}`.trim();

	if (loadingState === "loading") {
		return (
			<div className={containerClasses}>
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[hsl(var(--color-neutral-300))] border-t-[hsl(var(--color-neutral-900))] dark:border-[hsl(var(--color-neutral-700))] dark:border-t-[hsl(var(--color-neutral-100))]" />
						<p className="text-sm text-[hsl(var(--color-text-muted))]">
							Loading PDF...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (loadingState === "error" || error) {
		return (
			<div className={containerClasses}>
				<div className="flex h-full items-center justify-center">
					<div className="max-w-md rounded-lg border border-[hsl(var(--color-error))] bg-[hsl(var(--color-error-subtle))] p-6">
						<h2 className="text-lg font-semibold text-[hsl(var(--color-error))]">
							Error Loading PDF
						</h2>
						<p className="mt-2 text-sm text-[hsl(var(--color-error))]">
							{error || "An unknown error occurred"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Combine draft and persisted highlights
	const allHighlights = [
		...(highlights || []),
		...(draftHighlight ? [draftHighlight] : []),
	];

	// Calculate live region preview during drag
	const regionPreview =
		regionDragStart && regionDragCurrent
			? {
					left: Math.min(regionDragStart.x, regionDragCurrent.x),
					top: Math.min(regionDragStart.y, regionDragCurrent.y),
					width: Math.abs(regionDragCurrent.x - regionDragStart.x),
					height: Math.abs(regionDragCurrent.y - regionDragStart.y),
				}
			: null;

	return (
		<div className={containerClasses}>
			{/* PDF Canvas */}
			<ScrollArea viewportRef={scrollContainerRef} className="flex-1 pt-4">
				<div className="mx-auto w-fit rounded-lg bg-[hsl(var(--color-background))] shadow-lg">
					<div ref={pageContainerRef} className="relative">
						<canvas ref={canvasRef} className="block" />

						{/* Text Layer - selectable when textLayerInteractive is true */}
						{showTextLayer && (
							<div
								ref={textLayerRef}
								className="textLayer absolute left-0 top-0"
								style={{
									pointerEvents: textLayerInteractive ? "auto" : "none",
									// When interactive, text layer is on top (z-20)
									// When not interactive, text layer is below highlights (z-5)
									zIndex: textLayerInteractive ? 20 : 5,
								}}
							/>
						)}

						{/* Highlight Layer - clickable when NOT in text/region mode */}
						{allHighlights.length > 0 && viewport && (
							<PdfHighlightLayer
								pageNumber={currentPage}
								highlights={convertHighlightsForPage({
									highlights: allHighlights,
									pageNumber: currentPage,
									viewport: viewport,
								})}
								pageWidth={viewport.width}
								pageHeight={viewport.height}
								scale={1}
								onHighlightClick={onHighlightClick}
								style={{
									pointerEvents:
										textLayerInteractive || regionDrawingActive
											? "none"
											: "auto",
									// Highlights are always at z-10, above inactive text layer (z-5)
									// but below active text layer (z-20)
									zIndex: 10,
								}}
							/>
						)}

						{/* Region drawing preview - live rectangle during drag */}
						{regionPreview && (
							<div
								className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-400/20 dark:border-blue-400 dark:bg-blue-500/30"
								style={{
									left: regionPreview.left,
									top: regionPreview.top,
									width: regionPreview.width,
									height: regionPreview.height,
									zIndex: 30,
								}}
							/>
						)}
					</div>
				</div>
			</ScrollArea>

			{/* Draft Annotation Popover */}
			{renderDraftPopover && draftHighlight && (
				<PdfAnnotationPopover
					anchorElement={draftPopoverAnchor}
					isOpen={!!draftPopoverAnchor}
					onCancel={handleDraftCancel}
				>
					{renderDraftPopover({
						pageNumber: draftHighlight.pageNumber,
						text: draftHighlight.text || "",
						bboxes: draftHighlight.bboxes,
						onConfirm: handleDraftConfirm,
						onCancel: handleDraftCancel,
					})}
				</PdfAnnotationPopover>
			)}
		</div>
	);
};
