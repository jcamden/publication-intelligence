"use client";

import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import type {
	BoundingBox,
	PdfHighlight,
} from "../../../../types/pdf-highlight";
import { PdfHighlightLayer } from "../../../pdf-highlight-layer";

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
			bbox: convertBboxToViewport({ bbox: h.bbox, viewport }),
		}));
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
	scale = 1.75,
	currentPage = 1,
	onLoadSuccess,
	className = "",
	showTextLayer = true,
	highlights,
	onHighlightClick,
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

	return (
		<div className={containerClasses}>
			{/* PDF Canvas */}
			<div ref={scrollContainerRef} className="flex-1 overflow-auto pt-4">
				<div className="mx-auto w-fit rounded-lg bg-[hsl(var(--color-background))] shadow-lg">
					<div ref={pageContainerRef} className="relative">
						<canvas ref={canvasRef} className="block" />

						{/* Text Layer - selectable text (middle layer) */}
						{showTextLayer && (
							<div
								ref={textLayerRef}
								className="textLayer absolute left-0 top-0"
							/>
						)}

						{/* Highlight Layer - clickable highlights on top */}
						{highlights && viewport && (
							<PdfHighlightLayer
								pageNumber={currentPage}
								highlights={convertHighlightsForPage({
									highlights,
									pageNumber: currentPage,
									viewport: viewport,
								})}
								pageWidth={viewport.width}
								pageHeight={viewport.height}
								scale={1}
								onHighlightClick={onHighlightClick}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
