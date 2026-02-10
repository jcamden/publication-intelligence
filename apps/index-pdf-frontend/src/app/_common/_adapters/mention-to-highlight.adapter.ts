import type { PdfHighlight } from "@pubint/yaboujee";
import type { IndexMentionListItem } from "@/app/_common/_utils/trpc-types";

export const mentionToPdfHighlight = ({
	mention,
}: {
	mention: IndexMentionListItem;
}): PdfHighlight => {
	// Get colors from the indexTypes array (already includes color info)
	const colors = mention.indexTypes.map(
		(indexType: {
			projectIndexTypeId: string;
			indexType: string;
			colorHue: number;
		}) => {
			// Convert hue to oklch color (yaboujee expects oklch format)
			return `oklch(0.7 0.15 ${indexType.colorHue})`;
		},
	);

	return {
		id: mention.id,
		pageNumber: mention.pageNumber ?? 1,
		bboxes: mention.bboxes ?? [],
		label: mention.entry?.label || "Unlabeled",
		text: mention.textSpan,
		metadata: {
			entryId: mention.entryId,
			projectIndexTypeIds: mention.indexTypes.map(
				(indexType: {
					projectIndexTypeId: string;
					indexType: string;
					colorHue: number;
				}) => indexType.projectIndexTypeId,
			),
			colors: colors,
			mentionType: mention.mentionType,
			createdAt: mention.createdAt,
		},
	};
};
