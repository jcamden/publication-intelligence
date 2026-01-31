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
	File,
	FolderTree,
	type LucideIcon,
	Tags,
	User,
} from "lucide-react";
import type React from "react";
import {
	projectAccordionExpandedAtom,
	projectSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/atoms/editor-atoms";
import { SidebarAccordionItem } from "../sidebar-accordion-item";
import { ProjectAuthorContent } from "./project-author-content";
import { ProjectBiblioContent } from "./project-biblio-content";
import { ProjectContextsContent } from "./project-contexts-content";
import { ProjectPagesContent } from "./project-pages-content";
import { ProjectScriptureContent } from "./project-scripture-content";
import { ProjectSubjectContent } from "./project-subject-content";

/**
 * Project Sidebar Component
 *
 * Left sidebar showing project-level panels (pages, indices, etc.)
 */
export const ProjectSidebar = () => {
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
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
		<div className="h-full overflow-y-auto pt-4 px-4 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full">
			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="project-sidebar-accordion">
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
