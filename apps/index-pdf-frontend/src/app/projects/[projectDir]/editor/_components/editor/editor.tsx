"use client";

import type { PdfHighlight } from "@pubint/yaboujee";
import {
	PdfAnnotationPopover,
	PdfViewer,
	PdfViewerToolbar,
} from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
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
import { DeleteMentionDialog } from "../delete-mention-dialog";
import {
	type BoundingBox,
	type IndexEntry,
	MentionCreationPopover,
} from "../mention-creation-popover";
import { MentionDetailsPopover } from "../mention-details-popover";
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
	initialMentions?: Mention[]; // For testing only
};

export type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	bboxes: BoundingBox[];
	entryId: string;
	entryLabel: string;
	indexTypes: string[]; // ['subject', 'author', 'scripture']
	createdAt: Date;
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
 * NOTE: These are for Phase 2 positioning tests only.
 * Real mentions are managed in the mentions state array.
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
		bboxes: [{ x: 20, y: 772, width: 100, height: 15 }], // Near top (792-20=772)
	},
	{
		id: "top-right",
		pageNumber: 1,
		label: "Top-Right Corner",
		text: "Should be in top-right corner",
		bboxes: [{ x: 492, y: 772, width: 100, height: 15 }], // Near right edge (612-120=492)
	},
	{
		id: "bottom-left",
		pageNumber: 1,
		label: "Bottom-Left Corner",
		text: "Should be in bottom-left corner",
		bboxes: [{ x: 20, y: 20, width: 100, height: 15 }], // Near bottom
	},
	{
		id: "bottom-right",
		pageNumber: 1,
		label: "Bottom-Right Corner",
		text: "Should be in bottom-right corner",
		bboxes: [{ x: 492, y: 20, width: 100, height: 15 }],
	},
	// EDGES - MIDPOINTS
	{
		id: "left-middle",
		pageNumber: 1,
		label: "Left Edge Middle",
		text: "Should be on left edge, vertically centered",
		bboxes: [{ x: 20, y: 388, width: 80, height: 15 }], // 792/2 = 396, minus half height
	},
	{
		id: "right-middle",
		pageNumber: 1,
		label: "Right Edge Middle",
		text: "Should be on right edge, vertically centered",
		bboxes: [{ x: 512, y: 388, width: 80, height: 15 }], // 612-100=512
	},
	{
		id: "top-center",
		pageNumber: 1,
		label: "Top Edge Center",
		text: "Should be at top, horizontally centered",
		bboxes: [{ x: 256, y: 772, width: 100, height: 15 }], // 612/2 - 50 = 256
	},
	{
		id: "bottom-center",
		pageNumber: 1,
		label: "Bottom Edge Center",
		text: "Should be at bottom, horizontally centered",
		bboxes: [{ x: 256, y: 20, width: 100, height: 15 }],
	},
	// CENTER
	{
		id: "center",
		pageNumber: 1,
		label: "Dead Center",
		text: "Should be in the absolute center of the page",
		bboxes: [{ x: 256, y: 388, width: 100, height: 15 }], // (612/2 - 50, 792/2 - 7.5)
	},
];

/**
 * Mock index entries for Phase 4B testing - Autocomplete data
 *
 * TODO Phase 5: Replace with real data from API
 */
const mockIndexEntries: IndexEntry[] = [
	{ id: "1", label: "Kant, Immanuel", parentId: null },
	{ id: "2", label: "Critique of Pure Reason", parentId: "1" },
	{ id: "3", label: "Categorical Imperative", parentId: "1" },
	{ id: "4", label: "Philosophy", parentId: null },
	{ id: "5", label: "Metaphysics", parentId: "4" },
	{ id: "6", label: "Epistemology", parentId: "4" },
	{ id: "7", label: "Ethics", parentId: "4" },
	{ id: "8", label: "Aristotle", parentId: null },
	{ id: "9", label: "Nicomachean Ethics", parentId: "8" },
	{ id: "10", label: "Plato", parentId: null },
	{ id: "11", label: "The Republic", parentId: "10" },
	{ id: "12", label: "Theory of Forms", parentId: "10" },
];

export const Editor = ({ fileUrl, initialMentions = [] }: EditorProps) => {
	const hydrated = useHydrated();
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const [totalPages, setTotalPages] = useAtom(totalPagesAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);

	// Transient action state (replaces persistent annotationMode)
	const [activeAction, setActiveAction] = useState<{
		type: "select-text" | "draw-region" | null;
		indexType: string | null;
	}>({ type: null, indexType: null });

	// Mention state management
	// Phase 5 TODO: Replace with tRPC query
	// const mentionsQuery = trpc.mention.listByDocument.useQuery({ documentId });
	// const mentions = mentionsQuery.data ?? [];
	//
	// Current Phase 4 behavior:
	// - Mentions can be initialized for testing (initialMentions prop)
	// - handleDraftConfirmed simulates API call, then adds to state
	// - In Phase 5, this will be replaced with real API + optimistic updates
	const [mentions, setMentions] = useState<Mention[]>(initialMentions);
	const [clearDraftTrigger, setClearDraftTrigger] = useState(0);

	// Mention details popover state
	const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
	const [detailsAnchor, setDetailsAnchor] = useState<HTMLElement | null>(null);

	// Delete confirmation state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [mentionToDelete, setMentionToDelete] = useState<string | null>(null);

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

	const handleDraftConfirmed = useCallback(
		async ({
			draft,
			entry,
		}: {
			draft: { pageNumber: number; text: string; bboxes: BoundingBox[] };
			entry: { entryId: string; entryLabel: string; regionName?: string };
		}) => {
			// Capture which index type this mention was created from
			const indexType = activeAction.indexType || "subject"; // Default to subject if none

			// For region drafts, use regionName as the text; for text drafts, use draft.text
			const mentionText = entry.regionName || draft.text;

			// Phase 5 TODO: Replace with real tRPC mutation
			// const result = await createMentionMutation.mutateAsync({
			//   documentId,
			//   entryId: entry.entryId,
			//   pageNumber: draft.pageNumber,
			//   text: mentionText,
			//   bboxes: draft.bboxes,
			//   indexTypes: [indexType],
			// });

			// Simulated API call - draft stays visible until server responds
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Simulate server response (would come from tRPC in Phase 5)
			const serverMention: Mention = {
				id: crypto.randomUUID(), // In Phase 5: comes from server
				pageNumber: draft.pageNumber,
				text: mentionText, // Use regionName for regions, draft.text for text selections
				bboxes: draft.bboxes,
				entryId: entry.entryId,
				entryLabel: entry.entryLabel,
				indexTypes: [indexType], // Created from this index type
				createdAt: new Date(), // In Phase 5: comes from server
			};

			// Add server-confirmed mention to state
			setMentions((prev) => [...prev, serverMention]);

			// Clear draft and revert to view mode
			setActiveAction({ type: null, indexType: null });
			setClearDraftTrigger((prev) => prev + 1);
		},
		[activeAction.indexType],
	);

	const handleDraftCancelled = useCallback(() => {
		// Auto-revert to view mode when draft is cancelled
		setActiveAction({ type: null, indexType: null });
		setClearDraftTrigger((prev) => prev + 1);
	}, []);

	const handleHighlightClick = useCallback(
		(highlight: PdfHighlight) => {
			const mention = mentions.find((m) => m.id === highlight.id);
			if (mention) {
				// Find the highlight element to use as anchor
				const highlightEl = document.querySelector(
					`[data-testid="highlight-${highlight.id}"]`,
				);
				if (highlightEl instanceof HTMLElement) {
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions],
	);

	const handleMentionClickFromSidebar = useCallback(
		({ mentionId }: { mentionId: string }) => {
			const mention = mentions.find((m) => m.id === mentionId);
			if (mention) {
				// Find the highlight element to use as anchor
				const highlightEl = document.querySelector(
					`[data-testid="highlight-${mentionId}"]`,
				);
				if (highlightEl instanceof HTMLElement) {
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions],
	);

	const handleEditMention = useCallback(
		({ mentionId }: { mentionId: string }) => {
			// TODO: Implement edit functionality in future task
			// For now, just close the details popover
			console.log("Edit mention:", mentionId);
			setSelectedMention(null);
			setDetailsAnchor(null);
		},
		[],
	);

	const handleDeleteMention = useCallback(
		({ mentionId }: { mentionId: string }) => {
			setMentionToDelete(mentionId);
			setShowDeleteConfirm(true);
			// Close details popover
			setSelectedMention(null);
			setDetailsAnchor(null);
		},
		[],
	);

	const handleConfirmDelete = useCallback(async () => {
		if (!mentionToDelete) return;

		// Phase 5 TODO: Replace with real tRPC mutation
		// await deleteMentionMutation.mutateAsync({ id: mentionToDelete });

		// Simulated API call
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Remove mention after server confirms deletion
		setMentions((prev) => prev.filter((m) => m.id !== mentionToDelete));
		setMentionToDelete(null);
	}, [mentionToDelete]);

	const handleCloseDetailsPopover = useCallback(() => {
		setSelectedMention(null);
		setDetailsAnchor(null);
	}, []);

	// Keyboard handler for Delete key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Delete" && selectedMention) {
				e.preventDefault();
				handleDeleteMention({ mentionId: selectedMention.id });
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [selectedMention, handleDeleteMention]);

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

	// Convert mentions to PdfHighlight format for rendering
	const mentionHighlights: PdfHighlight[] = mentions.map((mention) => ({
		id: mention.id,
		pageNumber: mention.pageNumber,
		label: mention.entryLabel,
		text: mention.text,
		bboxes: mention.bboxes,
	}));

	// Combine mock highlights with real mentions
	const allHighlights = [...mockHighlights, ...mentionHighlights];

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
							highlights={allHighlights}
							onHighlightClick={handleHighlightClick}
							textLayerInteractive={activeAction.type === "select-text"}
							regionDrawingActive={activeAction.type === "draw-region"}
							onDraftConfirmed={handleDraftConfirmed}
							onDraftCancelled={handleDraftCancelled}
							clearDraftTrigger={clearDraftTrigger}
							renderDraftPopover={({
								pageNumber,
								text,
								bboxes,
								onConfirm,
								onCancel,
							}) => (
								<MentionCreationPopover
									draft={{
										pageNumber,
										text,
										bboxes,
										type: text ? "text" : "region",
									}}
									existingEntries={mockIndexEntries}
									onAttach={onConfirm}
									onCancel={onCancel}
								/>
							)}
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
							mentions={mentions}
							currentPage={currentPage}
							onMentionClick={handleMentionClickFromSidebar}
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
							mentions={mentions}
							currentPage={currentPage}
							onMentionClick={handleMentionClickFromSidebar}
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

			{/* Mention details popover */}
			{selectedMention && detailsAnchor && (
				<PdfAnnotationPopover
					anchorElement={detailsAnchor}
					isOpen={!!detailsAnchor}
					onCancel={handleCloseDetailsPopover}
				>
					<MentionDetailsPopover
						mention={{
							id: selectedMention.id,
							pageNumber: selectedMention.pageNumber,
							text: selectedMention.text,
							entryLabel: selectedMention.entryLabel,
							entryId: selectedMention.entryId,
							indexTypes: selectedMention.indexTypes,
						}}
						onEdit={handleEditMention}
						onDelete={handleDeleteMention}
					/>
				</PdfAnnotationPopover>
			)}

			{/* Delete confirmation dialog */}
			<DeleteMentionDialog
				isOpen={showDeleteConfirm}
				onOpenChange={({ open }) => setShowDeleteConfirm(open)}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
};
