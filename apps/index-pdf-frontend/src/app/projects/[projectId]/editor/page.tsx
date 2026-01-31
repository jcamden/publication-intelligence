"use client";

import { useParams } from "next/navigation";
import { PdfEditor } from "@/components/ui/pdf";
import { ProjectNavbar } from "@/components/ui/project-navbar";

/**
 * PDF Editor Page
 *
 * Layout: Three-section editor with integrated sidebars
 * - Left sidebar: Project-level panels (controlled by project bar)
 * - Center: PDF viewer with toolbar
 * - Right sidebar: Page-level panels (controlled by page bar)
 *
 * State management:
 * - Jotai atoms for panel visibility and PDF viewer state
 * - All state is managed within the PdfEditor component
 *
 * CURRENT STATUS:
 * - New three-section layout with project/page sidebars
 * - Toggle bars for controlling panel visibility
 *
 * TODO:
 * - Populate panel content with actual data
 * - Add text selection using PDF.js text layer
 * - Connect to real tRPC backend
 * - Add highlights overlay for mentions
 */
export default function EditorPage() {
	const params = useParams();
	const _projectId = params.projectId as string;

	// Mock PDF URL - replace with actual project document URL from tRPC
	const pdfUrl = "/sample.pdf";

	return (
		<>
			<ProjectNavbar userName="User" userEmail="user@example.com" />
			<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
				<PdfEditor fileUrl={pdfUrl} />
			</div>
		</>
	);
}
