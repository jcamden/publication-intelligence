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
import { useEffect, useRef } from "react";
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
	header?: string;
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
	header,
}: DraggableSidebarProps<TSectionId>) => {
	const viewportRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!contentRef.current || !viewportRef.current) return;

		const viewport = viewportRef.current;
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(() => {
				const currentScroll = viewport.scrollTop;
				const maxScroll = viewport.scrollHeight - viewport.clientHeight;

				if (maxScroll <= 0) {
					viewport.scrollTop = 1;
					viewport.scrollTop = 0;
				} else if (currentScroll >= maxScroll) {
					viewport.scrollTop = currentScroll - 1;
					viewport.scrollTop = currentScroll;
				} else {
					viewport.scrollTop = currentScroll + 1;
					viewport.scrollTop = currentScroll;
				}
			});
		});

		resizeObserver.observe(contentRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<ScrollArea
			className={`h-full ${side === "left" ? "border-r" : "border-l"} border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 w-full`}
			viewportRef={viewportRef}
		>
			{header && (
				<div
					className={`px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 ${side === "left" ? "text-left" : "text-right"}`}
				>
					<h2 className="text-md font-semibold text-neutral-900 dark:text-neutral-100">
						{header}
					</h2>
				</div>
			)}
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId={droppableId}>
					{(provided) => (
						<div
							ref={(node) => {
								provided.innerRef(node);
								if (node) {
									(
										contentRef as React.MutableRefObject<HTMLDivElement>
									).current = node;
								}
							}}
							{...provided.droppableProps}
						>
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
														isExpanded={isExpanded}
														onToggle={handleToggle}
														surfaceColorHue={meta.headerColorHue}
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
