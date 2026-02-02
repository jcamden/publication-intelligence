"use client";

import type { PdfHighlight } from "@pubint/yaboujee";
import { PdfViewer, PdfViewerToolbar } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import {
	currentPageAtom,
	MIN_PDF_WIDTH,
	MIN_SIDEBAR_WIDTH,
	pageSidebarCollapsedAtom,
	pageSidebarWidthAtom,
	pdfSectionLastWidthAtom,
	pdfSectionVisibleAtom,
	projectSidebarCollapsedAtom,
	projectSidebarWidthAtom,
	totalPagesAtom,
	zoomAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { useHydrated } from "@/app/projects/[projectDir]/editor/_hooks/use-hydrated";
import { PageBar } from "../page-bar";
import { PageSidebar } from "../page-sidebar";
import { ProjectBar } from "../project-bar";
import { ProjectSidebar } from "../project-sidebar";
import { ResizableSidebar } from "../resizable-sidebar";
import { WindowManager } from "../window-manager";

/**
 * PDF Editor - Three-section layout for PDF indexing
 *
 * ARCHITECTURE:
 * - Three-section layout: Project sidebar (left) | PDF viewer (center) | Page sidebar (right)
 * - Three top bars (fixed row): Project bar | PDF bar | Page bar
 * - Collapsible sidebars with toggle buttons
 * - Resizable sidebars with drag handles
 * - Floating windows for popped sections
 * - Uses jotai for state management with localStorage persistence
 *
 * STRUCTURE:
 * - Project sidebar: Project-level accordion panels (pages, indices, etc.)
 * - PDF viewer: Main PDF rendering area (can be hidden)
 * - Page sidebar: Page-level accordion panels (info, indices, etc.)
 * - Floating windows: Draggable/resizable windows for popped sections
 *
 * FUTURE ENHANCEMENTS:
 * - Text selection support using PDF.js text layer
 * - Highlights overlay for mentions
 * - Multi-bbox for line-wrapped selections
 * - Search highlighting
 */

type EditorProps = {
	fileUrl: string;
};

/**
 * Mock highlights for Phase 2 testing - Corner & Edge positioning
 *
 * Coordinates are in PDF user space:
 * - Origin: bottom-left of page
 * - Y increases upward
 * - Units: PDF points (1/72 inch)
 *
 * Assuming standard letter size: 612pt wide x 792pt tall (8.5" x 11")
 *
 * TODO Phase 5: Replace with real data from API
 */
const mockHighlights: PdfHighlight[] = [
	// CORNERS
	{
		id: "top-left",
		pageNumber: 1,
		label: "Top-Left Corner",
		text: "Should be in top-left corner",
		bbox: { x: 20, y: 772, width: 100, height: 15 }, // Near top (792-20=772)
	},
	{
		id: "top-right",
		pageNumber: 1,
		label: "Top-Right Corner",
		text: "Should be in top-right corner",
		bbox: { x: 492, y: 772, width: 100, height: 15 }, // Near right edge (612-120=492)
	},
	{
		id: "bottom-left",
		pageNumber: 1,
		label: "Bottom-Left Corner",
		text: "Should be in bottom-left corner",
		bbox: { x: 20, y: 20, width: 100, height: 15 }, // Near bottom
	},
	{
		id: "bottom-right",
		pageNumber: 1,
		label: "Bottom-Right Corner",
		text: "Should be in bottom-right corner",
		bbox: { x: 492, y: 20, width: 100, height: 15 },
	},
	// EDGES - MIDPOINTS
	{
		id: "left-middle",
		pageNumber: 1,
		label: "Left Edge Middle",
		text: "Should be on left edge, vertically centered",
		bbox: { x: 20, y: 388, width: 80, height: 15 }, // 792/2 = 396, minus half height
	},
	{
		id: "right-middle",
		pageNumber: 1,
		label: "Right Edge Middle",
		text: "Should be on right edge, vertically centered",
		bbox: { x: 512, y: 388, width: 80, height: 15 }, // 612-100=512
	},
	{
		id: "top-center",
		pageNumber: 1,
		label: "Top Edge Center",
		text: "Should be at top, horizontally centered",
		bbox: { x: 256, y: 772, width: 100, height: 15 }, // 612/2 - 50 = 256
	},
	{
		id: "bottom-center",
		pageNumber: 1,
		label: "Bottom Edge Center",
		text: "Should be at bottom, horizontally centered",
		bbox: { x: 256, y: 20, width: 100, height: 15 },
	},
	// CENTER
	{
		id: "center",
		pageNumber: 1,
		label: "Dead Center",
		text: "Should be in the absolute center of the page",
		bbox: { x: 256, y: 388, width: 100, height: 15 }, // (612/2 - 50, 792/2 - 7.5)
	},
];

export const Editor = ({ fileUrl }: EditorProps) => {
	const hydrated = useHydrated();
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const [totalPages, setTotalPages] = useAtom(totalPagesAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);

	// Transient action state (replaces persistent annotationMode)
	const [activeAction, setActiveAction] = useState<{
		type: "select-text" | "draw-region" | null;
		indexType: string | null;
	}>({ type: null, indexType: null });

	const projectCollapsed = useAtomValue(projectSidebarCollapsedAtom);
	const pageCollapsed = useAtomValue(pageSidebarCollapsedAtom);
	const [pdfVisible, setPdfVisible] = useAtom(pdfSectionVisibleAtom);
	const [pdfLastWidth, setPdfLastWidth] = useAtom(pdfSectionLastWidthAtom);
	const [projectWidth, setProjectWidth] = useAtom(projectSidebarWidthAtom);
	const [pageWidth, setPageWidth] = useAtom(pageSidebarWidthAtom);

	const handlePageChange = useCallback(
		({ page }: { page: number }) => {
			setCurrentPage(page);
		},
		[setCurrentPage],
	);

	const handleZoomChange = useCallback(
		({ zoom }: { zoom: number }) => {
			setZoom(zoom);
		},
		[setZoom],
	);

	const handleLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setTotalPages(numPages);
		},
		[setTotalPages],
	);

	const handleSelectText = useCallback(
		({ indexType }: { indexType: string }) => {
			setActiveAction({ type: "select-text", indexType });
		},
		[],
	);

	const handleDrawRegion = useCallback(
		({ indexType }: { indexType: string }) => {
			setActiveAction({ type: "draw-region", indexType });
		},
		[],
	);

	const handleCreateDraftHighlight = useCallback(
		(draft: { pageNumber: number; text: string; bbox: unknown }) => {
			console.log("Draft highlight created:", {
				page: draft.pageNumber,
				text: draft.text,
				bbox: JSON.stringify(draft.bbox),
				indexType: activeAction.indexType,
			});
			// Phase 4B: Show mention creation popover
			// Auto-revert to view mode after draft created
			setActiveAction({ type: null, indexType: null });
		},
		[activeAction.indexType],
	);

	const handleDraftCancelled = useCallback(() => {
		// Auto-revert to view mode when draft is cancelled
		setActiveAction({ type: null, indexType: null });
	}, []);

	const handlePdfVisibilityToggle = useCallback(() => {
		const viewportWidth = window.innerWidth / 16;

		if (pdfVisible) {
			// Hide PDF - expand sidebars to fill space, maintaining proportions
			const currentPdfWidth = viewportWidth - projectWidth - pageWidth;
			setPdfLastWidth(Math.max(MIN_PDF_WIDTH, currentPdfWidth));

			// Calculate current relative proportions
			const totalCurrentWidth = projectWidth + pageWidth;
			const projectRatio = projectWidth / totalCurrentWidth;
			const pageRatio = pageWidth / totalCurrentWidth;

			// Expand to fill full viewport
			setProjectWidth(viewportWidth * projectRatio);
			setPageWidth(viewportWidth * pageRatio);
			setPdfVisible(false);
		} else {
			// Show PDF - shrink sidebars to make room, maintaining proportions
			const restoreWidth = pdfLastWidth;
			const availableForSidebars = viewportWidth - restoreWidth;

			// Calculate current relative proportions
			const totalCurrentWidth = projectWidth + pageWidth;
			const projectRatio = projectWidth / totalCurrentWidth;
			const pageRatio = pageWidth / totalCurrentWidth;

			// Shrink sidebars proportionally
			setProjectWidth(
				Math.max(MIN_SIDEBAR_WIDTH, availableForSidebars * projectRatio),
			);
			setPageWidth(
				Math.max(MIN_SIDEBAR_WIDTH, availableForSidebars * pageRatio),
			);
			setPdfVisible(true);
		}
	}, [
		pdfVisible,
		projectWidth,
		pageWidth,
		pdfLastWidth,
		setPdfVisible,
		setPdfLastWidth,
		setProjectWidth,
		setPageWidth,
	]);

	// Determine if we should use full width for single visible section
	const onlyProjectVisible = !projectCollapsed && !pdfVisible && pageCollapsed;
	const onlyPageVisible = projectCollapsed && !pdfVisible && !pageCollapsed;

	// Wait for hydration to complete before rendering to prevent flash of default state
	if (!hydrated) {
		return null;
	}

	return (
		<div className="relative h-full w-full flex flex-col">
			{/* Fixed top bar row - all three bars in one row */}
			<div className="flex-shrink-0 flex justify-between items-center p-1 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
				<ProjectBar />
				<PdfViewerToolbar
					currentPage={currentPage}
					totalPages={totalPages}
					zoom={zoom}
					onPageChange={handlePageChange}
					onZoomChange={handleZoomChange}
					pdfVisible={pdfVisible}
					onPdfVisibilityToggle={handlePdfVisibilityToggle}
					showPdfToggle={true}
				/>
				<PageBar />
			</div>

			{/* Resizable sections row */}
			<div className="flex-1 flex min-h-0">
				{/* Project sidebar - always rendered, transitions to 0 width when collapsed */}
				{onlyProjectVisible ? (
					<div className="flex-1 min-w-0">
						<ProjectSidebar />
					</div>
				) : (
					<ResizableSidebar
						side="left"
						widthAtom={projectSidebarWidthAtom}
						isCollapsed={projectCollapsed}
					>
						<ProjectSidebar />
					</ResizableSidebar>
				)}

				{/* PDF section - conditional */}
				{pdfVisible && (
					<div className="flex-1 min-w-0 h-full relative">
						<PdfViewer
							url={fileUrl}
							scale={zoom}
							currentPage={currentPage}
							onPageChange={handlePageChange}
							onLoadSuccess={handleLoadSuccess}
							highlights={mockHighlights}
							onHighlightClick={(h) => {
								alert(
									`Highlight Clicked!\n\nLabel: ${h.label}\nText: ${h.text}\nPage: ${h.pageNumber}`,
								);
							}}
							textLayerInteractive={activeAction.type === "select-text"}
							regionDrawingActive={activeAction.type === "draw-region"}
							onCreateDraftHighlight={handleCreateDraftHighlight}
							onDraftCancelled={handleDraftCancelled}
						/>
					</div>
				)}

				{/* Page sidebar - always rendered, transitions to 0 width when collapsed */}
				{onlyPageVisible ? (
					<div className="flex-1 min-w-0">
						<PageSidebar
							activeAction={activeAction}
							onSelectText={handleSelectText}
							onDrawRegion={handleDrawRegion}
						/>
					</div>
				) : (
					<ResizableSidebar
						side="right"
						widthAtom={pageSidebarWidthAtom}
						isCollapsed={pageCollapsed}
					>
						<PageSidebar
							activeAction={activeAction}
							onSelectText={handleSelectText}
							onDrawRegion={handleDrawRegion}
						/>
					</ResizableSidebar>
				)}
			</div>

			{/* Windows overlay */}
			<WindowManager
				activeAction={activeAction}
				onSelectText={handleSelectText}
				onDrawRegion={handleDrawRegion}
			/>
		</div>
	);
};
