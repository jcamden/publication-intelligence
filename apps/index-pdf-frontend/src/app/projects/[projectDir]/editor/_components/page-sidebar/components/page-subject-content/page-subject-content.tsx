"use client";

import { StyledTextButton } from "@pubint/yaboujee";
import { ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import { IndexPanelScrollArea } from "@/app/projects/[projectDir]/editor/_components/index-panel-scroll-area";
import { MatcherDetectionModal } from "@/app/projects/[projectDir]/editor/_components/matcher-detection-modal";
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
	const [matcherModalOpen, setMatcherModalOpen] = useState(false);
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
					<>
						<StyledTextButton
							icon={ScanSearch}
							onClick={() => setMatcherModalOpen(true)}
							// tooltip="Matcher detection"
							className="w-full [&>button]:w-full [&>button]:justify-start !shadow-none"
						>
							Detect mentions on this page
						</StyledTextButton>
						<MatcherDetectionModal
							open={matcherModalOpen}
							onClose={() => setMatcherModalOpen(false)}
							scope="page"
							projectId={projectId}
							projectIndexTypeId={subjectProjectIndexTypeId}
							indexType="subject"
							documentId={documentId}
							pageNumber={pageNumber}
							emptyStateMessage="Create groups and matchers in this index, then run detection."
						/>
					</>
				)}
			<PageSectionContent
				mentions={mentions}
				onMentionClick={onMentionClick}
				onMentionEdit={onMentionEdit}
				onMentionDelete={onMentionDelete}
				projectId={projectId}
				documentId={documentId}
				pageNumber={pageNumber}
				listWrapper={(content) => (
					<IndexPanelScrollArea>{content}</IndexPanelScrollArea>
				)}
			/>
		</div>
	);
};
