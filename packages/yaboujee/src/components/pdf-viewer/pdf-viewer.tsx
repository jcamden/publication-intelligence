"use client";

import * as pdfjsLib from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

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
};

/**
 * PDF Viewer Component
 *
 * A minimal PDF viewer using PDF.js that renders one page at a time.
 * Navigation controls should be provided externally (e.g., PdfViewerToolbar).
 *
 * ## Features
 * - Renders PDF pages to canvas
 * - Controlled page navigation via props
 * - Loading and error states
 * - Configurable scale/zoom
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
}: PdfViewerProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [loadingState, setLoadingState] = useState<LoadingState>("idle");
	const [error, setError] = useState<string | null>(null);
	const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

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
				onLoadSuccess?.({ numPages: pdf.numPages });
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
	}, [url, onLoadSuccess]);

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

				const viewport = page.getViewport({ scale });
				const canvas = canvasRef.current;

				if (!canvas) {
					return;
				}

				const context = canvas.getContext("2d");
				if (!context) {
					return;
				}

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				const renderContext = {
					canvasContext: context,
					viewport: viewport,
				};

				await page.render(renderContext).promise;

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
		};
	}, [pdfDoc, currentPage, scale, loadingState]);

	const containerClasses =
		`flex h-full flex-col bg-[hsl(var(--color-neutral-100))] dark:bg-[hsl(var(--color-neutral-900))] ${className}`.trim();

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
			<div ref={scrollContainerRef} className="flex-1 overflow-auto pt-20">
				<div className="mx-auto w-fit rounded-lg bg-[hsl(var(--color-background))] shadow-lg">
					<canvas ref={canvasRef} className="block" />
				</div>
			</div>
		</div>
	);
};
