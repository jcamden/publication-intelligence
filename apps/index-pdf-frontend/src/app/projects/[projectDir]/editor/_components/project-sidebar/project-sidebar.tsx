"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DraggableSidebarContainer } from "@pubint/yaboujee/components/draggable-sidebar";
import { useAtom, useAtomValue } from "jotai";
import {
	BookOpen,
	File,
	type LucideIcon,
	SquaresSubtract,
	Tags,
	User,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useTheme } from "@/app/_common/_providers/theme-provider";
import {
	colorConfigAtom,
	moveWindowToFrontAtom,
	projectAccordionExpandedAtom,
	projectSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { ProjectAuthorContent } from "./components/project-author-content";
import { ProjectPagesContent } from "./components/project-pages-content";
import { ProjectRegionsContent } from "./components/project-regions-content";
import { ProjectScriptureContent } from "./components/project-scripture-content";
import { ProjectSubjectContent } from "./components/project-subject-content";

type ProjectSidebarProps = {
	enabledIndexTypes: string[]; // Index types enabled for this project
	activeAction?: { type: string | null; indexType: string | null }; // Current active action
	onDrawRegion?: () => void; // Callback to activate region drawing mode
	onEditRegion?: (regionId: string) => void; // Callback to edit region
};

/**
 * Project Sidebar Component
 *
 * Left sidebar showing project-level panels (pages, indices, etc.)
 */
export const ProjectSidebar = ({
	enabledIndexTypes,
	activeAction,
	onDrawRegion,
	onEditRegion,
}: ProjectSidebarProps) => {
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";
	const sections = useAtomValue(sectionsStateAtom);
	const colorConfig = useAtomValue(colorConfigAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const [expandedItems, setExpandedItems] = useAtom(
		projectAccordionExpandedAtom,
	);
	const [sectionOrder, setSectionOrder] = useAtom(projectSectionOrderAtom);

	const enabledIndexTypesSet = new Set(enabledIndexTypes);

	const handlePop = ({ id }: { id: SectionId }) => {
		const currentState = sections.get(id);
		// Preserve existing windowState if it exists, otherwise use defaults
		const defaultWindowState = {
			position: { x: 6.25, y: 6.25 },
			size: { width: 25, height: 18.75 },
			isMaximized: false,
			side: "left" as const,
		};
		updateSection({
			id,
			changes: {
				popped: true,
				windowState: {
					...(currentState?.windowState || defaultWindowState),
					side: "left",
				},
			},
		});
		moveToFront(id);
	};

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		const sourceIndex = result.source.index;
		const destIndex = result.destination.index;

		if (sourceIndex === destIndex) return;

		const newOrder = [...sectionOrder];
		const [movedItem] = newOrder.splice(sourceIndex, 1);
		newOrder.splice(destIndex, 0, movedItem);
		setSectionOrder(newOrder);
	};

	const allSectionMetadata: Partial<
		Record<
			SectionId,
			{
				title: string;
				icon: LucideIcon;
				content: React.ComponentType;
			}
		>
	> = useMemo(
		() => ({
			"project-pages": {
				title: "Pages",
				icon: File,
				content: ProjectPagesContent,
			},
			"project-subject": {
				title: "Subject Index",
				icon: Tags,
				content: ProjectSubjectContent,
			},
			"project-author": {
				title: "Author Index",
				icon: User,
				content: ProjectAuthorContent,
			},
			"project-scripture": {
				title: "Scripture Index",
				icon: BookOpen,
				content: ProjectScriptureContent,
			},
			"project-regions": {
				title: "Regions",
				icon: SquaresSubtract,
				content: () => (
					<ProjectRegionsContent
						activeAction={activeAction}
						onDrawRegion={onDrawRegion}
						onEditRegion={onEditRegion}
					/>
				),
			},
		}),
		[activeAction, onDrawRegion, onEditRegion],
	);

	// Filter sections to only include index types enabled for this project
	const sectionMetadata = Object.fromEntries(
		Object.entries(allSectionMetadata).filter(([sectionId]) => {
			// Always include non-index sections (pages, regions)
			if (sectionId === "project-pages" || sectionId === "project-regions") {
				return true;
			}
			// For index type sections, check if enabled for project
			const indexType = sectionId.replace("project-", "");
			return enabledIndexTypesSet.has(indexType);
		}),
	) as typeof allSectionMetadata;

	const visibleSections = sectionOrder.filter(
		(id) => sections.get(id)?.visible && !sections.get(id)?.popped,
	);

	return (
		<DraggableSidebarContainer
			visibleSections={visibleSections}
			sectionMetadata={sectionMetadata}
			expandedItems={expandedItems}
			onExpandedChange={setExpandedItems}
			onDragEnd={handleDragEnd}
			onPop={handlePop}
			droppableId="project-sidebar-accordion"
			side="left"
			colorConfig={colorConfig}
			isDarkMode={isDarkMode}
			header="Project"
		/>
	);
};
