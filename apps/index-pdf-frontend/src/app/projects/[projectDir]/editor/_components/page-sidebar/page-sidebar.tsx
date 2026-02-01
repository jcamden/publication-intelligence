"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DraggableSidebar } from "@pubint/yaboujee/components/draggable-sidebar";
import { useAtom, useAtomValue } from "jotai";
import {
	BookMarked,
	BookOpen,
	FolderTree,
	Info,
	type LucideIcon,
	Tags,
	User,
} from "lucide-react";
import type React from "react";
import {
	moveWindowToFrontAtom,
	pageAccordionExpandedAtom,
	pageSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { PageAuthorContent } from "./components/page-author-content";
import { PageBiblioContent } from "./components/page-biblio-content";
import { PageContextsContent } from "./components/page-contexts-content";
import { PageInfoContent } from "./components/page-info-content";
import { PageScriptureContent } from "./components/page-scripture-content";
import { PageSubjectContent } from "./components/page-subject-content";

/**
 * Page Sidebar Component
 *
 * Right sidebar showing page-level panels (info, indices, etc.)
 */
export const PageSidebar = () => {
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const [expandedItems, setExpandedItems] = useAtom(pageAccordionExpandedAtom);
	const [sectionOrder, setSectionOrder] = useAtom(pageSectionOrderAtom);

	const handlePop = ({ id }: { id: SectionId }) => {
		const currentState = sections.get(id);
		// Preserve existing windowState if it exists, otherwise use defaults on right side
		const viewportWidth = window.innerWidth / 16; // rem
		const windowWidth = 25; // rem
		const defaultWindowState = {
			position: { x: viewportWidth - windowWidth - 6.25, y: 6.25 },
			size: { width: 25, height: 18.75 },
			isMaximized: false,
			side: "right" as const,
		};
		updateSection({
			id,
			changes: {
				popped: true,
				windowState: {
					...(currentState?.windowState || defaultWindowState),
					side: "right",
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
		"page-info": {
			title: "Page Info",
			icon: Info,
			content: PageInfoContent,
		},
		"page-subject": {
			title: "Page Subject Index",
			icon: Tags,
			content: PageSubjectContent,
		},
		"page-author": {
			title: "Page Author Index",
			icon: User,
			content: PageAuthorContent,
		},
		"page-scripture": {
			title: "Page Scripture Index",
			icon: BookOpen,
			content: PageScriptureContent,
		},
		"page-biblio": {
			title: "Page Bibliography",
			icon: BookMarked,
			content: PageBiblioContent,
		},
		"page-contexts": {
			title: "Page Contexts",
			icon: FolderTree,
			content: PageContextsContent,
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
			droppableId="page-sidebar-accordion"
			side="right"
		/>
	);
};
