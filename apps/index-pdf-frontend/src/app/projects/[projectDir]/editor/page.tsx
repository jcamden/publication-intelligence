"use client";

import { useParams } from "next/navigation";
import { ProjectNavbar } from "@/app/projects/_components/project-navbar";
import { Editor } from "./_components/editor";

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
 * - Uses project_dir for routing
 *
 * TODO:
 * - Populate panel content with actual data
 * - Add text selection using PDF.js text layer
 * - Add highlights overlay for mentions
 */
export default function EditorPage() {
	const params = useParams();
	const _projectDir = params.projectDir as string;

	// TODO: Fetch project data and get actual PDF URL from source_document
	// const projectQuery = trpc.project.getByDir.useQuery({ projectDir });
	// const pdfUrl = projectQuery.data?.source_document
	//   ? `http://localhost:3001/source-documents/${projectQuery.data.source_document.id}/file`
	//   : "/sample.pdf";

	// Mock PDF URL - replace with actual project document URL from tRPC
	const pdfUrl = "/sample.pdf";

	return (
		<>
			<ProjectNavbar userName="User" userEmail="user@example.com" />
			<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
				<Editor fileUrl={pdfUrl} />
			</div>
		</>
	);
}
