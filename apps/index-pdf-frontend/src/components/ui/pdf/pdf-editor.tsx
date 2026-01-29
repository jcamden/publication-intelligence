"use client";

import { PdfViewer, PdfViewerToolbar } from "@pubint/yaboujee";
import { useCallback, useState } from "react";
import type {
	BoundingBox,
	DraftMention,
	ViewerMention,
} from "@/types/mentions";
import { SelectionPopover } from "./selection-popover";

/**
 * PDF Editor - Orchestrates PDF viewing with mentions and highlights
 *
 * ARCHITECTURE:
 * - Uses yaboujee PdfViewer for PDF.js rendering
 * - Overlays highlights for mentions
 * - Handles text selection and mention creation
 * - Client-side only (no SSR issues)
 *
 * KNOWN LIMITATIONS (MVP):
 * - Text selection not yet implemented
 * - Highlights shown as overlay (not integrated with PDF viewer)
 * - Single bbox per mention (no multi-line wrapping yet)
 *
 * FUTURE ENHANCEMENTS:
 * - Text selection support using PDF.js text layer
 * - Multi-bbox for line-wrapped selections
 * - Better rotation handling
 * - Virtualized rendering for large PDFs
 * - Thumbnail sidebar with mention counts per page
 * - Search highlighting
 * - Mention editing/deletion
 */

type PdfEditorProps = {
	fileUrl: string;
	mentions: ViewerMention[];
	onCreateMention?: (draft: DraftMention) => Promise<void> | void;
	onHighlightClick?: (mention: ViewerMention) => void;
};

export const PdfEditor = ({
	fileUrl,
	mentions: _mentions,
	onCreateMention,
	onHighlightClick: _onHighlightClick,
}: PdfEditorProps) => {
	const [selection, setSelection] = useState<{
		text: string;
		bboxes: BoundingBox[];
		pageNumber: number;
		anchorEl: HTMLElement;
	} | null>(null);
	const [isCreatingMention, setIsCreatingMention] = useState(false);

	// PDF viewer state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [zoom, setZoom] = useState(1.7);

	const _handleTextSelection = useCallback(
		(data: {
			text: string;
			bboxes: BoundingBox[];
			pageNumber: number;
			anchorEl: HTMLElement;
		}) => {
			if (data.text.trim().length === 0) {
				setSelection(null);
				return;
			}
			setSelection(data);
		},
		[],
	);

	const handleCreateMention = useCallback(async () => {
		if (!selection || !onCreateMention) return;

		setIsCreatingMention(true);
		try {
			const draft: DraftMention = {
				page_number: selection.pageNumber,
				text_span: selection.text,
				bboxes: selection.bboxes,
				anchor: {
					normalizedText: selection.text
						.toLowerCase()
						.replace(/\s+/g, " ")
						.trim(),
					pageIndex: selection.pageNumber - 1,
					confidence: "high",
				},
			};

			await onCreateMention(draft);
			setSelection(null);
		} catch (error) {
			console.error("Failed to create mention:", error);
		} finally {
			setIsCreatingMention(false);
		}
	}, [selection, onCreateMention]);

	const handleCancelSelection = useCallback(() => {
		setSelection(null);
	}, []);

	const handlePageChange = useCallback(({ page }: { page: number }) => {
		setCurrentPage(page);
	}, []);

	const handleZoomChange = useCallback(({ zoom }: { zoom: number }) => {
		setZoom(zoom);
	}, []);

	const handleLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setTotalPages(numPages);
		},
		[],
	);

	return (
		<div className="relative h-full w-full">
			{/* PDF Rendering using yaboujee PdfViewer */}

			<PdfViewer
				url={fileUrl}
				scale={zoom}
				currentPage={currentPage}
				onPageChange={handlePageChange}
				onLoadSuccess={handleLoadSuccess}
			/>

			{/* Floating Toolbar - overlaid on top with blur effect */}
			<div className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none">
				<div className="pointer-events-auto backdrop-blur-xs rounded-full bg-background/85">
					<PdfViewerToolbar
						currentPage={currentPage}
						totalPages={totalPages}
						zoom={zoom}
						onPageChange={handlePageChange}
						onZoomChange={handleZoomChange}
					/>
				</div>
			</div>

			{/* TODO: Add highlights overlay */}
			{/* TODO: Integrate text selection */}

			{/* Floating action for creating mentions */}
			{selection && (
				<SelectionPopover
					anchorEl={selection.anchorEl}
					onCreateMention={handleCreateMention}
					onCancel={handleCancelSelection}
					isCreating={isCreatingMention}
					selectedText={selection.text}
				/>
			)}
		</div>
	);
};
