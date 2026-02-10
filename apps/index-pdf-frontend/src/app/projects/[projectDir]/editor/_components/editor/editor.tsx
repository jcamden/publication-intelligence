"use client";

import type { PdfHighlight } from "@pubint/yaboujee";
import {
	PdfAnnotationPopover,
	PdfViewer,
	PdfViewerToolbar,
} from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useCreateMention } from "@/app/_common/_hooks/use-create-mention";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	colorConfigAtom,
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
import { ProjectProvider } from "../../_context/project-context";
import type { ColorConfig, IndexTypeName } from "../../_types/color-config";
import { ColorConfigProvider } from "../color-config-provider";
import { DeleteMentionDialog } from "../delete-mention-dialog";
import {
	type BoundingBox,
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
	projectId?: string;
	documentId?: string;
};

export type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	bboxes: BoundingBox[];
	entryId: string;
	entryLabel: string;
	indexTypes: string[]; // ['subject', 'author', 'scripture']
	type: "text" | "region";
	createdAt: Date;
};

export const Editor = ({ fileUrl, projectId, documentId }: EditorProps) => {
	const hydrated = useHydrated();
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const [totalPages, setTotalPages] = useAtom(totalPagesAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);

	// Transient action state (replaces persistent annotationMode)
	const [activeAction, setActiveAction] = useState<{
		type: "select-text" | "draw-region" | null;
		indexType: string | null;
	}>({ type: null, indexType: null });

	// Fetch project index types from backend
	const projectIndexTypesQuery = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId ?? "" },
		{ enabled: !!projectId },
	);

	// Mutation for creating mentions
	const createMention = useCreateMention({ projectId: projectId || "" });

	// Fetch all entries for the project (needed for mention details popover)
	const { data: backendAllEntries = [] } = trpc.indexEntry.list.useQuery(
		{
			projectId: projectId ?? "",
		},
		{ enabled: !!projectId },
	);

	// Convert backend entries to frontend format (add indexType field by looking up projectIndexType)
	const allEntries = backendAllEntries.map((e) => {
		const projectIndexType = projectIndexTypesQuery.data?.find(
			(pit) => pit.id === e.projectIndexTypeId,
		);
		return {
			...e,
			indexType: projectIndexType?.indexType || "subject",
			metadata: {
				aliases: e.variants.map((v) => v.text),
			},
		};
	});

	// Fetch mentions from backend (used for page sidebar and highlights)
	const { data: backendMentions = [] } = trpc.indexMention.list.useQuery(
		{
			projectId: projectId ?? "",
			documentId: documentId ?? "",
		},
		{ enabled: !!projectId && !!documentId },
	);

	// Convert backend mentions to editor format
	const mentions: Mention[] = backendMentions.map((m) => ({
		id: m.id,
		pageNumber: m.pageNumber ?? 1,
		text: m.textSpan,
		bboxes: m.bboxes ?? [],
		entryId: m.entryId,
		entryLabel: m.entry.label,
		indexTypes: m.indexTypes.map((t) => t.indexType),
		type: m.mentionType,
		createdAt: new Date(m.createdAt),
	}));

	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);

	// Sync project-specific colors from DB to colorConfig atom
	useEffect(() => {
		if (!projectIndexTypesQuery.data) return;

		const dbColorConfig = projectIndexTypesQuery.data.reduce(
			(acc, pit) => {
				if (pit.colorHue !== null) {
					const indexTypeName = pit.indexType as IndexTypeName;
					acc[indexTypeName] = {
						hue: pit.colorHue,
					};
				}
				return acc;
			},
			{} as Partial<ColorConfig>,
		);

		if (Object.keys(dbColorConfig).length > 0) {
			setColorConfig((prev) => ({ ...prev, ...dbColorConfig }));
		}
	}, [projectIndexTypesQuery.data, setColorConfig]);

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
			setActiveAction((current) => {
				// Toggle off if already active for this indexType
				if (current.type === "select-text" && current.indexType === indexType) {
					return { type: null, indexType: null };
				}
				return { type: "select-text", indexType };
			});
		},
		[],
	);

	const handleDrawRegion = useCallback(
		({ indexType }: { indexType: string }) => {
			setActiveAction((current) => {
				// Toggle off if already active for this indexType
				if (current.type === "draw-region" && current.indexType === indexType) {
					return { type: null, indexType: null };
				}
				return { type: "draw-region", indexType };
			});
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

			// Find the projectIndexTypeId for this index type
			const projectIndexType = projectIndexTypesQuery.data?.find(
				(pit) => pit.indexType === indexType,
			);

			if (!projectIndexType) {
				console.error(`No projectIndexType found for indexType: ${indexType}`);
				return;
			}

			// For region drafts, use regionName as the text; for text drafts, use draft.text
			const mentionText = entry.regionName || draft.text;

			// Create mention via tRPC mutation
			await createMention.mutateAsync({
				documentId: documentId || "",
				entryId: entry.entryId,
				pageNumber: draft.pageNumber,
				textSpan: mentionText,
				bboxesPdf: draft.bboxes,
				projectIndexTypeIds: [projectIndexType.id],
				mentionType: entry.regionName ? "region" : "text",
			});

			// Clear draft and revert to view mode
			setActiveAction({ type: null, indexType: null });
			setClearDraftTrigger((prev) => prev + 1);
		},
		[
			activeAction.indexType,
			createMention,
			documentId,
			projectIndexTypesQuery.data,
		],
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
					// Scroll into view if off-screen
					highlightEl.scrollIntoView({
						behavior: "smooth",
						block: "center",
						inline: "nearest",
					});

					// Show popover (same as direct click)
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions],
	);

	const handleMentionDetailsClose = useCallback(
		async (_params: {
			mentionId: string;
			indexTypes: string[];
			entryId?: string;
			entryLabel?: string;
			text?: string;
		}) => {
			// NOTE: Currently updating local state immediately.
			// Phase 5 TODO: Replace with optimistic update pattern:
			// 1. Immediately update local state (optimistic)
			// 2. Call backend API
			// 3. If API fails, revert to previous state
			// 4. If API succeeds, state is already correct
			//
			// This ensures UI feels instant while staying in sync with backend.
			// await updateMentionIndexTypesMutation.mutateAsync({ id: mentionId, indexTypes });

			// Simulated API call
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Phase 5: Mention updates now handled by tRPC mutations
			// The tRPC cache will be automatically invalidated by the mutations
			// TODO: Wire up actual tRPC updateMention mutation
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

		// Phase 5: Mention deletion now handled by tRPC mutation
		// The tRPC cache will be automatically invalidated by the mutation
		// TODO: Wire up actual tRPC deleteMention mutation
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

	// Get visible index type names from projectIndexTypes
	const visibleIndexTypeNames = new Set<string>(
		projectIndexTypesQuery.data
			?.filter((pit) => pit.visible !== false)
			.map((pit) => pit.indexType) ?? [],
	);

	// Filter mentions to only include those with ALL types visible
	const visibleMentions = mentions.filter((mention) =>
		mention.indexTypes.every((typeName) => visibleIndexTypeNames.has(typeName)),
	);

	// Convert visible mentions to PdfHighlight format for rendering
	const mentionHighlights: PdfHighlight[] = visibleMentions.map((mention) => {
		// Map mention.indexTypes to hues from colorConfig
		const hues = mention.indexTypes
			.map((typeName) => {
				const typeColor = colorConfig[typeName as IndexTypeName];
				return typeColor ? typeColor.hue : null;
			})
			.filter((hue): hue is number => hue !== null);

		return {
			id: mention.id,
			pageNumber: mention.pageNumber,
			label: mention.entryLabel,
			text: mention.text,
			bboxes: mention.bboxes,
			metadata: {
				indexTypes: mention.indexTypes,
				hues: hues.length > 0 ? hues : [60], // Fallback to yellow hue
			},
		};
	});

	// Use real mentions as highlights
	const allHighlights = mentionHighlights;

	// Get enabled index types for this project (to filter sidebar sections)
	const enabledIndexTypes =
		projectIndexTypesQuery.data?.map((pit) => pit.indexType) ?? [];

	// Wait for hydration to complete before rendering to prevent flash of default state
	if (!hydrated) {
		return null;
	}

	return (
		<ColorConfigProvider>
			<ProjectProvider projectId={projectId} documentId={documentId}>
				<div className="relative h-full w-full flex flex-col">
					{/* Fixed top bar row - all three bars in one row */}
					<div className="flex-shrink-0 flex justify-between items-center p-1 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
						<ProjectBar enabledIndexTypes={enabledIndexTypes} />
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
						<PageBar enabledIndexTypes={enabledIndexTypes} />
					</div>

					{/* Resizable sections row */}
					<div className="flex-1 flex min-h-0">
						{/* Project sidebar - always rendered, transitions to 0 width when collapsed */}
						{onlyProjectVisible ? (
							<div className="flex-1 min-w-0">
								<ProjectSidebar enabledIndexTypes={enabledIndexTypes} />
							</div>
						) : (
							<ResizableSidebar
								side="left"
								widthAtom={projectSidebarWidthAtom}
								isCollapsed={projectCollapsed}
							>
								<ProjectSidebar enabledIndexTypes={enabledIndexTypes} />
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
												documentId: documentId || "",
												pageNumber,
												text,
												bboxes,
												type: text ? "text" : "region",
											}}
											indexType={activeAction.indexType || "subject"}
											entries={allEntries}
											mentions={mentions}
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
									enabledIndexTypes={enabledIndexTypes}
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
									enabledIndexTypes={enabledIndexTypes}
								/>
							</ResizableSidebar>
						)}
					</div>

					{/* Windows overlay */}
					<WindowManager
						activeAction={activeAction}
						onSelectText={handleSelectText}
						onDrawRegion={handleDrawRegion}
						mentions={mentions}
						currentPage={currentPage}
						onMentionClick={handleMentionClickFromSidebar}
						enabledIndexTypes={enabledIndexTypes}
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
									type: selectedMention.type,
								}}
								existingEntries={allEntries}
								onDelete={handleDeleteMention}
								onClose={handleMentionDetailsClose}
								onCancel={handleCloseDetailsPopover}
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
			</ProjectProvider>
		</ColorConfigProvider>
	);
};
