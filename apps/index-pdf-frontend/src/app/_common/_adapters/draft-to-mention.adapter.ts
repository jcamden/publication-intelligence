import type { CreateIndexMentionInput } from "@/app/_common/_utils/trpc-types";
import type { MentionDraft } from "@/app/projects/[projectDir]/editor/_components/mention-creation-popover/mention-creation-popover";

export const draftToMentionInput = ({
	draft,
	entryId,
}: {
	draft: MentionDraft;
	entryId: string;
}): CreateIndexMentionInput => {
	return {
		documentId: draft.documentId,
		entryId,
		pageNumber: draft.pageNumber,
		textSpan: draft.text,
		bboxesPdf: draft.bboxes,
		mentionType: draft.type,
	};
};
