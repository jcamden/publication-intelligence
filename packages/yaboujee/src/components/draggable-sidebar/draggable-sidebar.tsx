"use client";

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { Accordion } from "@pubint/yabasic/components/ui/accordion";
import { ScrollArea } from "@pubint/yabasic/components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";
import type React from "react";
import { SidebarAccordionItem } from "./components/sidebar-accordion-item";

type ActionButtons = {
	indexType: string;
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

export type SectionMetadata = {
	title: string;
	icon: LucideIcon;
	content: React.ComponentType;
	actionButtons?: ActionButtons;
	headerColorHue?: number; // Hue value 0-360
	isDarkMode?: boolean; // Optional dark mode flag from parent
};

type DraggableSidebarProps<TSectionId extends string> = {
	visibleSections: TSectionId[];
	sectionMetadata: Partial<Record<TSectionId, SectionMetadata>>;
	expandedItems: string[];
	onExpandedChange: (value: string[]) => void;
	onDragEnd: (result: DropResult) => void;
	onPop: (args: { id: TSectionId }) => void;
	droppableId: string;
	side: "left" | "right";
};

export const DraggableSidebar = <TSectionId extends string>({
	visibleSections,
	sectionMetadata,
	expandedItems,
	onExpandedChange,
	onDragEnd,
	onPop,
	droppableId,
	side,
}: DraggableSidebarProps<TSectionId>) => {
	return (
		<ScrollArea
			className={`h-full ${side === "left" ? "border-r" : "border-l"} border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full`}
		>
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId={droppableId}>
					{(provided) => (
						<div ref={provided.innerRef} {...provided.droppableProps}>
							<Accordion
								multiple
								value={expandedItems}
								onValueChange={onExpandedChange}
							>
								{visibleSections.map((sectionId, index) => {
									const meta = sectionMetadata[sectionId];
									if (!meta) return null;

									const Content = meta.content;
									const isExpanded = expandedItems.includes(sectionId);

									const handleToggle = () => {
										if (isExpanded) {
											onExpandedChange(
												expandedItems.filter((id) => id !== sectionId),
											);
										} else {
											onExpandedChange([...expandedItems, sectionId]);
										}
									};

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
														onPop={() => onPop({ id: sectionId })}
														dragHandleProps={provided.dragHandleProps}
														index={index}
														side={side}
														actionButtons={meta.actionButtons}
														isExpanded={isExpanded}
														onToggle={handleToggle}
														headerColorHue={meta.headerColorHue}
														isDarkMode={meta.isDarkMode}
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
		</ScrollArea>
	);
};
