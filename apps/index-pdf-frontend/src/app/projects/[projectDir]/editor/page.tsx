"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { API_URL } from "@/app/_common/_config/api";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { trpc } from "@/app/_common/_utils/trpc";
import { ProjectNavbar } from "@/app/projects/_components/project-navbar";
import { useAuthenticatedPdf } from "@/app/projects/_hooks/use-authenticated-pdf";
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
	const router = useRouter();
	const projectDir = params.projectDir as string;
	const {
		isAuthenticated,
		isLoading: authLoading,
		clearToken,
	} = useAuthToken();

	const userQuery = trpc.auth.me.useQuery(undefined, {
		enabled: isAuthenticated,
	});

	const projectQuery = trpc.project.getByDir.useQuery(
		{ projectDir },
		{
			enabled: isAuthenticated,
		},
	);

	// Get authenticated PDF URL from source_document
	const apiUrl = projectQuery.data?.source_document
		? `${API_URL}/source-documents/${projectQuery.data.source_document.id}/file`
		: null;

	const {
		blobUrl,
		isLoading: pdfLoading,
		error: pdfError,
	} = useAuthenticatedPdf({ url: apiUrl });

	// Fallback to sample PDF if no source document
	const pdfUrl = blobUrl ?? "/sample.pdf";

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, authLoading, router]);

	const handleSignOut = () => {
		clearToken();
		router.push("/login");
	};

	if (!isAuthenticated && !authLoading) {
		return null;
	}

	const isLoading = authLoading || projectQuery.isLoading || pdfLoading;

	if (isLoading) {
		return (
			<>
				<ProjectNavbar
					userName={userQuery.data?.name ?? undefined}
					userEmail={userQuery.data?.email ?? undefined}
					onSignOutClick={handleSignOut}
				/>
				<div className="flex items-center justify-center h-[calc(100vh-3.5rem-1px)]">
					<div className="text-center">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
						<p className="text-muted-foreground">Loading...</p>
					</div>
				</div>
			</>
		);
	}

	// Handle project not found or error
	if (projectQuery.isError) {
		return (
			<>
				<ProjectNavbar
					userName={userQuery.data?.name ?? undefined}
					userEmail={userQuery.data?.email ?? undefined}
					onSignOutClick={handleSignOut}
				/>
				<div className="flex items-center justify-center h-[calc(100vh-3.5rem-1px)]">
					<div className="text-center">
						<p className="text-destructive mb-2">Failed to load project</p>
						<p className="text-muted-foreground text-sm">
							{projectQuery.error.message}
						</p>
					</div>
				</div>
			</>
		);
	}

	// Handle PDF loading error
	if (pdfError) {
		return (
			<>
				<ProjectNavbar
					userName={userQuery.data?.name ?? undefined}
					userEmail={userQuery.data?.email ?? undefined}
					onSignOutClick={handleSignOut}
				/>
				<div className="flex items-center justify-center h-[calc(100vh-3.5rem-1px)]">
					<div className="text-center">
						<p className="text-destructive mb-2">Failed to load PDF</p>
						<p className="text-muted-foreground text-sm">{pdfError}</p>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<ProjectNavbar
				userName={userQuery.data?.name ?? undefined}
				userEmail={userQuery.data?.email ?? undefined}
				onSignOutClick={handleSignOut}
			/>
			<div className="h-[calc(100vh-3.5rem-1px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
				<Editor fileUrl={pdfUrl} />
			</div>
		</>
	);
}
