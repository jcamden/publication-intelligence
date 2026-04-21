"use client";

import { PageDetectionPanel } from "./page-detection-panel";

export type PageAiContentProps = {
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const PageAiContent = ({
	projectId,
	documentId,
	pageNumber,
}: PageAiContentProps) => {
	if (!projectId || !documentId || pageNumber == null || pageNumber < 1) {
		return (
			<div className="p-4 space-y-4">
				<p className="text-sm text-neutral-500">
					AI features for the current page will appear here.
				</p>
			</div>
		);
	}

	return (
		<div className="p-4 space-y-4">
			<PageDetectionPanel
				projectId={projectId}
				documentId={documentId}
				pageNumber={pageNumber}
			/>
		</div>
	);
};
