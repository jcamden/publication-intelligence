"use client";

import { StyledButton } from "@pubint/yaboujee";
import { SquareDashedMousePointer, TextSelect } from "lucide-react";

type MentionActionButtonsProps = {
	indexType: string;
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

export const MentionActionButtons = ({
	indexType,
	activeAction,
	onSelectText,
	onDrawRegion,
}: MentionActionButtonsProps) => {
	const isSelectTextActive =
		activeAction.type === "select-text" && activeAction.indexType === indexType;
	const isDrawRegionActive =
		activeAction.type === "draw-region" && activeAction.indexType === indexType;

	return (
		<div className="flex gap-2 mb-3">
			<StyledButton
				icon={TextSelect}
				label="Select Text"
				isActive={isSelectTextActive}
				onClick={() => onSelectText({ indexType })}
			/>
			<StyledButton
				icon={SquareDashedMousePointer}
				label="Draw Region"
				isActive={isDrawRegionActive}
				onClick={() => onDrawRegion({ indexType })}
			/>
		</div>
	);
};
