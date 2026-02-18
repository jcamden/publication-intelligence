"use client";

import type { PdfHighlight } from "@pubint/yaboujee";
import { PdfAnnotationPopover, PdfViewer } from "@pubint/yaboujee";
import { formatOklchColor } from "@pubint/yaboujee/utils/index-type-colors";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useCreateMention } from "@/app/_common/_hooks/use-create-mention";
import { trpc } from "@/app/_common/_utils/trpc";
import {
	colorConfigAtom,
	currentPageAtom,
	highlightColorConfigAtom,
	MIN_PDF_WIDTH,
	MIN_SIDEBAR_WIDTH,
	pageSidebarCollapsedAtom,
	pageSidebarWidthAtom,
	pdfSectionLastWidthAtom,
	pdfSectionVisibleAtom,
	pdfUrlAtom,
	projectSidebarCollapsedAtom,
	projectSidebarWidthAtom,
	regionTypeColorConfigAtom,
	totalPagesAtom,
	zoomAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { useHydrated } from "@/app/projects/[projectDir]/editor/_hooks/use-hydrated";
import { ProjectProvider } from "../../_context/project-context";
import type {
	HighlightColorConfig,
	IndexTypeName,
} from "../../_types/highlight-config";
import type { IndexEntry } from "../../_types/index-entry";
import { getEntryDisplayLabel } from "../../_utils/index-entry-utils";
import { ColorConfigProvider } from "../color-config-provider";
import { CreateExcludeRegionModal } from "../create-exclude-region-modal";
import { CreatePageNumberRegionModal } from "../create-page-number-region-modal";
import { DeleteMentionDialog } from "../delete-mention-dialog";
import {
	type BoundingBox,
	MentionCreationPopover,
} from "../mention-creation-popover";
import { MentionDetailsPopover } from "../mention-details-popover";
import { PageBar } from "../page-bar";
import { PageSidebar } from "../page-sidebar";
import { PdfEditorToolbar } from "../pdf-editor-toolbar";
import { ProjectBar } from "../project-bar";
import { ProjectSidebar } from "../project-sidebar";
import { RegionCreationModal } from "../region-creation-modal";
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
	indexType: string;
	type: "text" | "region";
	pageSublocation?: string | null;
	detectionRunId?: string | null;
	createdAt: Date;
};

export const Editor = ({ fileUrl, projectId, documentId }: EditorProps) => {
	const hydrated = useHydrated();
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const [totalPages, setTotalPages] = useAtom(totalPagesAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);
	const [, setPdfUrl] = useAtom(pdfUrlAtom);
	const regionTypeColorConfig = useAtomValue(regionTypeColorConfigAtom);

	// Transient action state (replaces persistent annotationMode)
	const [activeAction, setActiveAction] = useState<{
		type: "select-text" | "draw-region" | "highlight" | null;
		indexType: string | null;
	}>({ type: null, indexType: null });

	// Type selection state with localStorage persistence
	const [selectedRegionType, setSelectedRegionType] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("pdf-editor-selected-type") || "page_number";
		}
		return "page_number";
	});

	// Region creation/edit state
	const [excludeRegionModalOpen, setExcludeRegionModalOpen] = useState(false);
	const [pageNumberRegionModalOpen, setPageNumberRegionModalOpen] =
		useState(false);
	const [regionModalOpen, setRegionModalOpen] = useState(false); // For edit mode only
	const [regionToEdit, setRegionToEdit] = useState<string | null>(null); // Region ID for editing
	const [drawnRegionBbox, setDrawnRegionBbox] = useState<BoundingBox | null>(
		null,
	);

	// Track if entry creation modal is open (prevents mention popover from closing)
	const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

	// Log state changes
	useEffect(() => {
		console.log("[Editor] isEntryModalOpen changed:", isEntryModalOpen);
	}, [isEntryModalOpen]);

	// Set PDF URL atom when fileUrl changes
	useEffect(() => {
		setPdfUrl(fileUrl);
	}, [fileUrl, setPdfUrl]);

	// Fetch project index types from backend
	const projectIndexTypesQuery = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId ?? "" },
		{ enabled: !!projectId },
	);

	// Mutation for creating mentions
	const createMention = useCreateMention({ projectId: projectId || "" });

	// Get tRPC utils for cache invalidation
	const utils = trpc.useUtils();

	// Mutation for deleting mentions
	const deleteMentionMutation = trpc.indexMention.delete.useMutation({
		onSuccess: () => {
			utils.indexMention.list.invalidate();
			utils.indexEntry.getIndexView.invalidate();
		},
	});

	// Mutation for updating mentions (from mention-details-popover save)
	const updateMentionMutation = trpc.indexMention.update.useMutation({
		onSuccess: () => {
			utils.indexMention.list.invalidate();
			utils.indexEntry.getIndexView.invalidate();
		},
	});

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
			indexType: (projectIndexType?.indexType ||
				"subject") as IndexEntry["indexType"],
			metadata: {
				matchers: e.matchers?.map((m) => m.text) || [],
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
	const mentions: Mention[] = backendMentions.map((m) => {
		// Find the full entry to compute breadcrumbs
		const entry = allEntries.find((e) => e.id === m.entryId);
		const entryLabel = entry
			? getEntryDisplayLabel({ entry, entries: allEntries })
			: m.entry.label;

		return {
			id: m.id,
			pageNumber: m.pageNumber ?? 1,
			text: m.textSpan,
			bboxes: m.bboxes ?? [],
			entryId: m.entryId,
			entryLabel,
			indexType: m.indexTypes[0]?.indexType ?? "",
			type: m.mentionType,
			pageSublocation: m.pageSublocation ?? null,
			detectionRunId: m.detectionRunId,
			createdAt: new Date(m.createdAt),
		};
	});

	// Fetch regions for current page
	const { data: regionsForPage = [] } = trpc.region.getForPage.useQuery(
		{
			projectId: projectId ?? "",
			pageNumber: currentPage,
		},
		{ enabled: !!projectId && currentPage > 0 },
	);

	// TODO Phase 6: Integrate RegionLayer into PdfViewer
	// Contexts are fetched above but need to be rendered on the PDF.
	// Similar to how PdfHighlightLayer renders mentions, regions need:
	// 1. Add renderRegionLayer prop to PdfViewer (in yaboujee)
	// 2. Pass contextsForPage and onRegionClick handler
	// 3. RegionLayer needs page dimensions (width/height) from PDF.js
	// For now, regions are managed via sidebar but not rendered on PDF yet.

	const [colorConfig] = useAtom(colorConfigAtom);
	const [, setHighlightColorConfig] = useAtom(highlightColorConfigAtom);

	// Sync project-specific colors from DB to unified highlight config atom
	useEffect(() => {
		if (!projectIndexTypesQuery.data) return;

		const dbConfig = projectIndexTypesQuery.data.reduce(
			(acc, pit) => {
				if (pit.colorHue !== null) {
					// Works for both index types and region types
					const typeName = pit.indexType as keyof HighlightColorConfig;
					acc[typeName] = {
						hue: pit.colorHue,
					};
				}
				return acc;
			},
			{} as Partial<HighlightColorConfig>,
		);

		if (Object.keys(dbConfig).length > 0) {
			setHighlightColorConfig((prev) => ({ ...prev, ...dbConfig }));
		}
	}, [projectIndexTypesQuery.data, setHighlightColorConfig]);

	const [clearDraftTrigger, setClearDraftTrigger] = useState(0);

	// Mention details popover state
	const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
	const [detailsAnchor, setDetailsAnchor] = useState<HTMLElement | null>(null);
	const [popoverInitialMode, setPopoverInitialMode] = useState<"view" | "edit">(
		"view",
	);

	// Delete confirmation state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [mentionToDelete, setMentionToDelete] = useState<string | null>(null);

	const projectCollapsed = useAtomValue(projectSidebarCollapsedAtom);
	const pageCollapsed = useAtomValue(pageSidebarCollapsedAtom);
	const [pdfVisible, setPdfVisible] = useAtom(pdfSectionVisibleAtom);
	const [pdfLastWidth, setPdfLastWidth] = useAtom(pdfSectionLastWidthAtom);
	const [projectWidth, setProjectWidth] = useAtom(projectSidebarWidthAtom);
	const [pageWidth, setPageWidth] = useAtom(pageSidebarWidthAtom);

	// Get enabled index types for this project (needed early for callbacks)
	const enabledIndexTypes =
		projectIndexTypesQuery.data?.map((pit) => pit.indexType) ?? [];

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

	const handleTypeChange = useCallback(
		(type: string) => {
			setSelectedRegionType(type);
			localStorage.setItem("pdf-editor-selected-type", type);

			// Update activeAction's indexType if a tool is currently active
			setActiveAction((current) => {
				if (current.type === null) {
					// No tool active, nothing to update
					return current;
				}
				// Update indexType based on new type selection
				const newIndexType = (enabledIndexTypes as string[]).includes(type)
					? type
					: null;
				return {
					...current,
					indexType: newIndexType,
				};
			});
		},
		[enabledIndexTypes],
	);

	const isIndexType = useCallback(
		(type: string): boolean => {
			return (enabledIndexTypes as string[]).includes(type);
		},
		[enabledIndexTypes],
	);

	const handleSelectText = useCallback(() => {
		setActiveAction((current) => {
			// Toggle off if already active
			if (current.type === "select-text") {
				return { type: null, indexType: null };
			}
			// Turn on with indexType from selectedRegionType (only if it's an index type)
			return {
				type: "select-text",
				indexType: isIndexType(selectedRegionType) ? selectedRegionType : null,
			};
		});
	}, [selectedRegionType, isIndexType]);

	const handleDrawRegion = useCallback(() => {
		setActiveAction((current) => {
			// Toggle off if already active
			if (current.type === "draw-region") {
				return { type: null, indexType: null };
			}
			// Turn on with indexType from selectedRegionType (only if it's an index type)
			return {
				type: "draw-region",
				indexType: isIndexType(selectedRegionType) ? selectedRegionType : null,
			};
		});
	}, [selectedRegionType, isIndexType]);

	const handleHighlightInteraction = useCallback(() => {
		setActiveAction((current) => {
			if (current.type === "select-text" || current.type === "draw-region") {
				return { type: null, indexType: null };
			}
			return {
				type: current.type === "highlight" ? null : "highlight",
				indexType: null,
			};
		});
	}, []);

	const handleEditRegion = useCallback((regionId: string) => {
		setRegionToEdit(regionId);
		setRegionModalOpen(true);
	}, []);

	const handleDraftConfirmed = useCallback(
		async ({
			draft,
			entry,
		}: {
			draft: { pageNumber: number; text: string; bboxes: BoundingBox[] };
			entry: { entryId: string; entryLabel: string; regionName?: string };
		}) => {
			// Check if this is region creation mode for Exclude/Page Number (no indexType)
			if (
				activeAction.type === "draw-region" &&
				activeAction.indexType === null
			) {
				// Store the bbox and open appropriate modal based on selectedRegionType
				setDrawnRegionBbox(draft.bboxes[0] || null);
				setRegionToEdit(null); // Clear edit mode

				// Clear the draft immediately to prevent pointer-events blocking
				setClearDraftTrigger((prev) => prev + 1);

				// Open modal after a small delay to ensure draft is cleared
				setTimeout(() => {
					if (selectedRegionType === "exclude") {
						setExcludeRegionModalOpen(true);
					} else if (selectedRegionType === "page_number") {
						setPageNumberRegionModalOpen(true);
					}
				}, 0);

				return;
			}

			// For region drafts, use regionName as the text; for text drafts, use draft.text
			const mentionText = entry.regionName || draft.text;

			// Create mention via tRPC mutation (index type inherited from entry)
			await createMention.mutateAsync({
				documentId: documentId || "",
				entryId: entry.entryId,
				pageNumber: draft.pageNumber,
				textSpan: mentionText,
				bboxesPdf: draft.bboxes,
				mentionType: entry.regionName ? "region" : "text",
			});

			// Clear draft but keep tool active
			setClearDraftTrigger((prev) => prev + 1);
		},
		[
			activeAction.indexType,
			activeAction.type,
			createMention,
			documentId,
			selectedRegionType,
		],
	);

	const handleDraftCancelled = useCallback(() => {
		// Clear draft but keep tool active
		setClearDraftTrigger((prev) => prev + 1);
	}, []);

	const handleHighlightClick = useCallback(
		(highlight: PdfHighlight) => {
			// Check if this is a region click
			if (highlight.metadata?.isRegion) {
				const regionId = highlight.id.replace("region-", "");
				const region = regionsForPage.find((r) => r.id === regionId);
				if (region) {
					setRegionToEdit(regionId);
					setRegionModalOpen(true);
					return;
				}
			}

			// Regular mention click
			const mention = mentions.find((m) => m.id === highlight.id);
			if (mention) {
				// Find the highlight element to use as anchor
				const highlightEl = document.querySelector(
					`[data-testid="highlight-${highlight.id}"]`,
				);
				if (highlightEl instanceof HTMLElement) {
					setPopoverInitialMode("view");
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions, regionsForPage],
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

					// Show popover in view mode
					setPopoverInitialMode("view");
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions],
	);

	const handleMentionEditFromSidebar = useCallback(
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

					// Show popover in edit mode
					setPopoverInitialMode("edit");
					setDetailsAnchor(highlightEl);
					setSelectedMention(mention);
				}
			}
		},
		[mentions],
	);

	const handleMentionDetailsClose = useCallback(
		async (params: {
			mentionId: string;
			entryId?: string;
			entryLabel?: string;
			text?: string;
			pageSublocation?: string | null;
		}) => {
			if (!projectId || !documentId) return;

			const mention = mentions.find((m) => m.id === params.mentionId);
			if (!mention) return;

			const hasChanges =
				(params.entryId !== undefined && params.entryId !== mention.entryId) ||
				(params.text !== undefined && params.text !== mention.text) ||
				(params.pageSublocation !== undefined &&
					params.pageSublocation !== (mention.pageSublocation ?? ""));

			if (!hasChanges) return;

			await updateMentionMutation.mutateAsync({
				id: params.mentionId,
				projectId,
				documentId,
				pageNumber: mention.pageNumber,
				...(params.entryId !== undefined && { entryId: params.entryId }),
				...(params.text !== undefined && { textSpan: params.text }),
				...(params.pageSublocation !== undefined && {
					pageSublocation: params.pageSublocation,
				}),
			});
		},
		[projectId, documentId, mentions, updateMentionMutation],
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
		if (!mentionToDelete || !projectId || !documentId) return;

		const mention = mentions.find((m) => m.id === mentionToDelete);
		if (!mention) return;

		await deleteMentionMutation.mutateAsync({
			id: mentionToDelete,
			projectId,
			documentId,
			pageNumber: mention.pageNumber,
		});

		setMentionToDelete(null);
		setShowDeleteConfirm(false);
	}, [mentionToDelete, projectId, documentId, mentions, deleteMentionMutation]);

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

	// Filter mentions to only include those with index type visible
	const visibleMentions = mentions.filter((mention) =>
		visibleIndexTypeNames.has(mention.indexType),
	);

	// Convert visible mentions to PdfHighlight format for rendering
	const mentionHighlights: PdfHighlight[] = visibleMentions.map((mention) => {
		const typeColor = colorConfig[mention.indexType as IndexTypeName];
		const hue = typeColor ? typeColor.hue : 60;

		return {
			id: mention.id,
			pageNumber: mention.pageNumber,
			label: mention.entryLabel,
			text: mention.text,
			bboxes: mention.bboxes,
			metadata: {
				indexTypes: [mention.indexType],
				hues: [hue],
			},
		};
	});

	// Convert regions to highlight format for rendering
	// TODO: Create dedicated region rendering in yaboujee for better styling (dashed borders)
	const regionHighlights: PdfHighlight[] = regionsForPage
		.filter((reg) => reg.visible)
		.map((reg) => {
			// Get color from region type config
			const hue = regionTypeColorConfig[reg.regionType].hue;
			const color = formatOklchColor({
				hue,
				lightness: 0.8,
				chroma: 0.2,
			});

			return {
				id: `region-${reg.id}`,
				pageNumber: currentPage,
				label: reg.regionType === "exclude" ? "Exclude" : "Page Number",
				text: "",
				bboxes: [reg.bbox],
				metadata: {
					isRegion: true,
					regionType: reg.regionType,
					regionColor: color,
				},
			};
		});

	// Combine mentions and regions for rendering
	const allHighlights = [...mentionHighlights, ...regionHighlights];

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
						<PdfEditorToolbar
							currentPage={currentPage}
							totalPages={totalPages}
							zoom={zoom}
							onPageChange={handlePageChange}
							onZoomChange={handleZoomChange}
							pdfVisible={pdfVisible}
							onPdfVisibilityToggle={handlePdfVisibilityToggle}
							showPdfToggle={true}
							activeAction={activeAction}
							selectedType={selectedRegionType}
							onSelectText={handleSelectText}
							onDrawRegion={handleDrawRegion}
							onHighlightInteraction={handleHighlightInteraction}
							onTypeChange={handleTypeChange}
							enabledIndexTypes={enabledIndexTypes}
						/>
						<PageBar enabledIndexTypes={enabledIndexTypes} />
					</div>

					{/* Resizable sections row */}
					<div className="flex-1 flex min-h-0">
						{/* Project sidebar - always rendered, transitions to 0 width when collapsed */}
						{onlyProjectVisible ? (
							<div className="flex-1 min-w-0">
								<ProjectSidebar
									enabledIndexTypes={enabledIndexTypes}
									onEditRegion={handleEditRegion}
								/>
							</div>
						) : (
							<ResizableSidebar
								side="left"
								widthAtom={projectSidebarWidthAtom}
								isCollapsed={projectCollapsed}
							>
								<ProjectSidebar
									enabledIndexTypes={enabledIndexTypes}
									onEditRegion={handleEditRegion}
								/>
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
									}) => {
										// For region drawing without an index type (Exclude/Page Number), auto-confirm
										if (
											activeAction.type === "draw-region" &&
											activeAction.indexType === null
										) {
											// Auto-confirm to trigger handleDraftConfirmed which opens region modal
											onConfirm({
												entryId: "",
												entryLabel: "",
											});
											return null;
										}

										// For both select-text and draw-region with index types, show mention popover
										const currentIndexType =
											activeAction.indexType || "subject";
										const projectIndexTypeId =
											projectIndexTypesQuery.data?.find(
												(pit) => pit.indexType === currentIndexType,
											)?.id;

										return (
											<MentionCreationPopover
												draft={{
													documentId: documentId || "",
													pageNumber,
													text,
													bboxes,
													type: text ? "text" : "region",
												}}
												indexType={currentIndexType}
												entries={allEntries}
												mentions={mentions}
												projectId={projectId || ""}
												projectIndexTypeId={projectIndexTypeId || ""}
												onAttach={onConfirm}
												onCancel={onCancel}
												onModalStateChange={setIsEntryModalOpen}
											/>
										);
									}}
									shouldPreventDraftPopoverClose={() => {
										console.log(
											"[Editor] shouldPreventDraftPopoverClose called, returning:",
											isEntryModalOpen,
										);
										return isEntryModalOpen;
									}}
									draftPopoverZIndex={isEntryModalOpen ? 30 : 50}
								/>
							</div>
						)}

						{/* Page sidebar - always rendered, transitions to 0 width when collapsed */}
						{onlyPageVisible ? (
							<div className="flex-1 min-w-0">
								<PageSidebar
									mentions={mentions}
									currentPage={currentPage}
									onMentionClick={handleMentionClickFromSidebar}
									onMentionEdit={handleMentionEditFromSidebar}
									onMentionDelete={handleDeleteMention}
									enabledIndexTypes={enabledIndexTypes}
									projectId={projectId}
									documentId={documentId}
								/>
							</div>
						) : (
							<ResizableSidebar
								side="right"
								widthAtom={pageSidebarWidthAtom}
								isCollapsed={pageCollapsed}
							>
								<PageSidebar
									mentions={mentions}
									currentPage={currentPage}
									onMentionClick={handleMentionClickFromSidebar}
									onMentionEdit={handleMentionEditFromSidebar}
									onMentionDelete={handleDeleteMention}
									enabledIndexTypes={enabledIndexTypes}
									projectId={projectId}
									documentId={documentId}
								/>
							</ResizableSidebar>
						)}
					</div>

					{/* Windows overlay */}
					<WindowManager
						onEditRegion={handleEditRegion}
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
									indexType: selectedMention.indexType,
									type: selectedMention.type,
									pageSublocation: selectedMention.pageSublocation,
								}}
								existingEntries={allEntries}
								onDelete={handleDeleteMention}
								onClose={handleMentionDetailsClose}
								onCancel={handleCloseDetailsPopover}
								initialMode={popoverInitialMode}
							/>
						</PdfAnnotationPopover>
					)}

					{/* Delete confirmation dialog */}
					<DeleteMentionDialog
						isOpen={showDeleteConfirm}
						onOpenChange={({ open }) => setShowDeleteConfirm(open)}
						onConfirm={handleConfirmDelete}
					/>

					{/* Create Exclude Region modal */}
					<CreateExcludeRegionModal
						open={excludeRegionModalOpen}
						onClose={() => {
							setExcludeRegionModalOpen(false);
							setDrawnRegionBbox(null);
						}}
						projectId={projectId || ""}
						currentPage={currentPage}
						documentPageCount={totalPages}
						drawnBbox={drawnRegionBbox}
					/>

					{/* Create Page Number Region modal */}
					<CreatePageNumberRegionModal
						open={pageNumberRegionModalOpen}
						onClose={() => {
							setPageNumberRegionModalOpen(false);
							setDrawnRegionBbox(null);
						}}
						projectId={projectId || ""}
						currentPage={currentPage}
						documentPageCount={totalPages}
						drawnBbox={drawnRegionBbox}
					/>

					{/* Region edit modal (keep existing for edit functionality) */}
					<RegionCreationModal
						open={regionModalOpen}
						onClose={() => {
							setRegionModalOpen(false);
							setRegionToEdit(null);
							setDrawnRegionBbox(null);
						}}
						projectId={projectId || ""}
						currentPage={currentPage}
						documentPageCount={totalPages}
						drawnBbox={drawnRegionBbox}
						regionId={regionToEdit || undefined}
					/>
				</div>
			</ProjectProvider>
		</ColorConfigProvider>
	);
};
