"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DraggableSidebar } from "@pubint/yaboujee/components/draggable-sidebar";
import { useAtom, useAtomValue } from "jotai";
import {
	BookMarked,
	BookOpen,
	File,
	FolderTree,
	type LucideIcon,
	Tags,
	User,
} from "lucide-react";
import type React from "react";
import {
	moveWindowToFrontAtom,
	projectAccordionExpandedAtom,
	projectSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { ProjectAuthorContent } from "./components/project-author-content";
import { ProjectBiblioContent } from "./components/project-biblio-content";
import { ProjectContextsContent } from "./components/project-contexts-content";
import { ProjectPagesContent } from "./components/project-pages-content";
import { ProjectScriptureContent } from "./components/project-scripture-content";
import { ProjectSubjectContent } from "./components/project-subject-content";

/**
 * Project Sidebar Component
 *
 * Left sidebar showing project-level panels (pages, indices, etc.)
 */
export const ProjectSidebar = () => {
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const [expandedItems, setExpandedItems] = useAtom(
		projectAccordionExpandedAtom,
	);
	const [sectionOrder, setSectionOrder] = useAtom(projectSectionOrderAtom);

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

	const sectionMetadata: Partial<
		Record<
			SectionId,
			{
				title: string;
				icon: LucideIcon;
				content: React.ComponentType;
			}
		>
	> = {
		"project-pages": {
			title: "Project Pages",
			icon: File,
			content: ProjectPagesContent,
		},
		"project-subject": {
			title: "Project Subject Index",
			icon: Tags,
			content: ProjectSubjectContent,
		},
		"project-author": {
			title: "Project Author Index",
			icon: User,
			content: ProjectAuthorContent,
		},
		"project-scripture": {
			title: "Project Scripture Index",
			icon: BookOpen,
			content: ProjectScriptureContent,
		},
		"project-biblio": {
			title: "Project Bibliography",
			icon: BookMarked,
			content: ProjectBiblioContent,
		},
		"project-contexts": {
			title: "Project Contexts",
			icon: FolderTree,
			content: ProjectContextsContent,
		},
	};

	const visibleSections = sectionOrder.filter(
		(id) => sections.get(id)?.visible && !sections.get(id)?.popped,
	);

	return (
		<DraggableSidebar
			visibleSections={visibleSections}
			sectionMetadata={sectionMetadata}
			expandedItems={expandedItems}
			onExpandedChange={setExpandedItems}
			onDragEnd={handleDragEnd}
			onPop={handlePop}
			droppableId="project-sidebar-accordion"
			side="left"
		/>
	);
};
