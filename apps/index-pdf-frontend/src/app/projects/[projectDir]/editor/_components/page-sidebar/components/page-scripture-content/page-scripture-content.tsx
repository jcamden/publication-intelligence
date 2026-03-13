"use client";

import { useMemo } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import { PageMatcherRunControls } from "../page-matcher-run-controls";
import { PageSectionContent } from "../page-section-content/page-section-content";

type MentionData = {
	id: string;
	text: string;
	entryLabel: string;
	type: "text" | "region";
	detectionRunId?: string | null;
};

type PageScriptureContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	onMentionEdit?: ({ mentionId }: { mentionId: string }) => void;
	onMentionDelete?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const PageScriptureContent = ({
	mentions,
	onMentionClick,
	onMentionEdit,
	onMentionDelete,
	projectId,
	documentId,
	pageNumber,
}: PageScriptureContentProps) => {
	const { data: projectIndexTypes } = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	const scriptureProjectIndexTypeId = useMemo(
		() =>
			projectIndexTypes?.find((t) => t.indexType === "scripture")?.id ||
			undefined,
		[projectIndexTypes],
	);

	return (
		<div className="space-y-4">
			{scriptureProjectIndexTypeId &&
				projectId &&
				documentId &&
				pageNumber != null &&
				pageNumber >= 1 && (
					<PageMatcherRunControls
						projectId={projectId}
						projectIndexTypeId={scriptureProjectIndexTypeId}
						indexType="scripture"
						documentId={documentId}
						pageNumber={pageNumber}
						emptyStateMessage="Create groups and matchers in this index, then run detection."
					/>
				)}
			<PageSectionContent
				mentions={mentions}
				onMentionClick={onMentionClick}
				onMentionEdit={onMentionEdit}
				onMentionDelete={onMentionDelete}
				projectId={projectId}
				documentId={documentId}
				pageNumber={pageNumber}
			/>
		</div>
	);
};
