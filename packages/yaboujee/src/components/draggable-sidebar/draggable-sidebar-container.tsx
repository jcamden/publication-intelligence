"use client";

import type { DropResult } from "@hello-pangea/dnd";
import type { LucideIcon } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { DraggableSidebar } from "./draggable-sidebar";

type IndexTypeName = "subject" | "author" | "scripture";

type ColorConfig = {
	[K in IndexTypeName]: { hue: number };
};

type ActionButtons = {
	indexType: string;
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

type SectionMetadata = {
	title: string;
	icon: LucideIcon;
	content: React.ComponentType;
	actionButtons?: ActionButtons;
	headerColorHue?: number; // Hue value 0-360
	isDarkMode?: boolean; // Optional dark mode flag from parent
};

type DraggableSidebarContainerProps<TSectionId extends string> = {
	visibleSections: TSectionId[];
	sectionMetadata: Partial<
		Record<TSectionId, Omit<SectionMetadata, "headerColorHue" | "isDarkMode">>
	>;
	expandedItems: string[];
	onExpandedChange: (value: string[]) => void;
	onDragEnd: (result: DropResult) => void;
	onPop: (args: { id: TSectionId }) => void;
	droppableId: string;
	side: "left" | "right";
	colorConfig: ColorConfig;
	isDarkMode?: boolean; // Optional dark mode flag from parent
	header?: string;
};

const extractIndexType = ({
	sectionId,
}: {
	sectionId: string;
}): IndexTypeName | null => {
	if (sectionId.includes("subject")) return "subject";
	if (sectionId.includes("author")) return "author";
	if (sectionId.includes("scripture")) return "scripture";
	return null;
};

export const DraggableSidebarContainer = <TSectionId extends string>({
	visibleSections,
	sectionMetadata,
	colorConfig,
	isDarkMode,
	...props
}: DraggableSidebarContainerProps<TSectionId>) => {
	const derivedMetadata = useMemo(() => {
		const result: Partial<Record<TSectionId, SectionMetadata>> = {};

		for (const [id, meta] of Object.entries(sectionMetadata) as [
			TSectionId,
			Omit<SectionMetadata, "headerColorHue" | "isDarkMode">,
		][]) {
			if (!meta) continue;

			const indexType = extractIndexType({ sectionId: id });

			result[id] = {
				...meta,
				headerColorHue:
					indexType && colorConfig[indexType]
						? colorConfig[indexType].hue
						: undefined,
				isDarkMode,
			};
		}

		return result;
	}, [sectionMetadata, colorConfig, isDarkMode]);

	return (
		<DraggableSidebar
			{...props}
			visibleSections={visibleSections}
			sectionMetadata={derivedMetadata}
		/>
	);
};
