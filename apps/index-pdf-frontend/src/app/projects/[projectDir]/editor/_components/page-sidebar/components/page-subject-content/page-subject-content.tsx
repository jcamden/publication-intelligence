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

type PageSubjectContentProps = {
	mentions: MentionData[];
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	onMentionEdit?: ({ mentionId }: { mentionId: string }) => void;
	onMentionDelete?: ({ mentionId }: { mentionId: string }) => void;
	projectId?: string;
	documentId?: string;
	pageNumber?: number;
};

export const PageSubjectContent = ({
	mentions,
	onMentionClick,
	onMentionEdit,
	onMentionDelete,
	projectId,
	documentId,
	pageNumber,
}: PageSubjectContentProps) => {
	const { data: projectIndexTypes } = trpc.projectIndexType.list.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	const subjectProjectIndexTypeId = useMemo(
		() =>
			projectIndexTypes?.find((t) => t.indexType === "subject")?.id ||
			undefined,
		[projectIndexTypes],
	);

	return (
		<div className="space-y-4">
			{subjectProjectIndexTypeId &&
				projectId &&
				documentId &&
				pageNumber != null &&
				pageNumber >= 1 && (
					<PageMatcherRunControls
						projectId={projectId}
						projectIndexTypeId={subjectProjectIndexTypeId}
						indexType="subject"
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
