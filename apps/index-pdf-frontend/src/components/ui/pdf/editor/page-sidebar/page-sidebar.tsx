"use client";

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { Accordion } from "@pubint/yabasic/components/ui/accordion";
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
	pageAccordionExpandedAtom,
	pageSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/atoms/editor-atoms";
import { SidebarAccordionItem } from "../sidebar-accordion-item";
import { PageAuthorContent } from "./page-author-content";
import { PageBiblioContent } from "./page-biblio-content";
import { PageContextsContent } from "./page-contexts-content";
import { PageInfoContent } from "./page-info-content";
import { PageScriptureContent } from "./page-scripture-content";
import { PageSubjectContent } from "./page-subject-content";

/**
 * Page Sidebar Component
 *
 * Right sidebar showing page-level panels (info, indices, etc.)
 */
export const PageSidebar = () => {
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
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
		};
		updateSection({
			id,
			changes: {
				popped: true,
				windowState: currentState?.windowState || defaultWindowState,
			},
		});
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
		<div className="h-full overflow-y-auto pt-4 px-4 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full">
			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="page-sidebar-accordion">
					{(provided) => (
						<div ref={provided.innerRef} {...provided.droppableProps}>
							<Accordion value={expandedItems} onValueChange={setExpandedItems}>
								{visibleSections.map((sectionId, index) => {
									const meta = sectionMetadata[sectionId];
									if (!meta) return null;

									const Content = meta.content;

									return (
										<Draggable
											key={sectionId}
											draggableId={sectionId}
											index={index}
										>
											{(provided) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
												>
													<SidebarAccordionItem
														value={sectionId}
														title={meta.title}
														icon={meta.icon}
														onPop={() => handlePop({ id: sectionId })}
														dragHandleProps={provided.dragHandleProps}
													>
														<Content />
													</SidebarAccordionItem>
												</div>
											)}
										</Draggable>
									);
								})}
							</Accordion>
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		</div>
	);
};
