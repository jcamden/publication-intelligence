"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MentionsSidebar, PdfEditor } from "@/components/ui/pdf";
import { ProjectNavbar } from "@/components/ui/project-navbar";
import { createMention, listMentions } from "@/lib/api/mentions-mock";
import type { DraftMention, ViewerMention } from "@/types/mentions";

/**
 * PDF Editor Page
 *
 * Layout: [Sidebar] [PDF Viewer] [Entry Panel]
 * - Left sidebar: List of mentions
 * - Center: PDF with highlights
 * - Right sidebar: (Future) Entry details/editing
 *
 * State management:
 * - Mentions loaded from mock API (will be tRPC)
 * - Selection state in PdfViewer component
 *
 * CURRENT STATUS:
 * - Mock data + placeholder PDF viewer
 * - Mentions sidebar working
 *
 * TODO:
 * - Replace placeholder with yaboujee PdfViewer + highlights
 * - Add text selection using PDF.js text layer
 * - Connect to real tRPC backend
 */
export default function EditorPage() {
	const params = useParams();
	const projectId = params.projectId as string;

	const [mentions, setMentions] = useState<ViewerMention[]>([]);
	const [selectedMentionId, setSelectedMentionId] = useState<string | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Mock PDF URL - replace with actual project document URL from tRPC
	const pdfUrl = "/sample.pdf";
	// Mock document ID - will come from project query
	const documentId = "doc-1";

	// Load mentions on mount
	useEffect(() => {
		const loadMentions = async () => {
			try {
				setIsLoading(true);
				const data = await listMentions({ documentId });
				setMentions(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load mentions",
				);
			} finally {
				setIsLoading(false);
			}
		};

		loadMentions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleCreateMention = useCallback(
		async (draft: DraftMention) => {
			try {
				// TODO: Let user select entry (for now, hardcoded)
				const entryId = "entry-1";

				const newMention = await createMention({
					documentId,
					entryId,
					draft,
				});

				// Add to local state (optimistic update would be better)
				setMentions((prev) => [
					...prev,
					{
						id: newMention.id,
						page_number: newMention.page_number,
						text_span: newMention.text_span,
						bbox: newMention.bbox,
						entryLabel: "AI Concepts", // Mock label
						range_type: newMention.range_type,
					},
				]);
			} catch (err) {
				console.error("Failed to create mention:", err);
				throw err;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const handleMentionClick = useCallback((mention: ViewerMention) => {
		setSelectedMentionId(mention.id);
		// TODO: Scroll PDF to mention location
		// TODO: Show entry details in right sidebar
	}, []);

	const handleHighlightClick = useCallback((mention: ViewerMention) => {
		setSelectedMentionId(mention.id);
		// TODO: Scroll sidebar to mention card
	}, []);

	if (error) {
		return (
			<>
				<ProjectNavbar userName="User" userEmail="user@example.com" />
				<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
					<div className="text-center">
						<h1 className="text-lg font-semibold text-red-600 dark:text-red-400">
							Error
						</h1>
						<p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
							{error}
						</p>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<ProjectNavbar userName="User" userEmail="user@example.com" />
			<div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
				{/* Left Sidebar - Mentions List */}
				<div className="w-80 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700">
					{isLoading ? (
						<div className="flex h-full items-center justify-center">
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								Loading mentions...
							</p>
						</div>
					) : (
						<>
							<div className="border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
								<h1 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Project {projectId}
								</h1>
								<p className="text-lg font-semibold">Document Editor</p>
								<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
									{mentions.length} mentions
								</p>
							</div>
							<MentionsSidebar
								mentions={mentions}
								onMentionClick={handleMentionClick}
								selectedMentionId={selectedMentionId}
							/>
						</>
					)}
				</div>

				{/* Center - PDF Editor */}
				<div className="flex-1 overflow-hidden">
					<PdfEditor
						fileUrl={pdfUrl}
						mentions={mentions}
						onCreateMention={handleCreateMention}
						onHighlightClick={handleHighlightClick}
					/>
				</div>

				{/* Right Sidebar - Entry Details (Future) */}
				<div className="w-80 flex-shrink-0 border-l border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
					<div className="flex h-full items-center justify-center p-4">
						<p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
							Entry details panel
							<br />
							(Coming soon)
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
