"use client";

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@pubint/yabasic/components/ui/button";
import { cn } from "@pubint/yabasic/lib/utils";
import type { ToggleButton } from "@pubint/yaboujee";

type DraggableToggleButtonGroupProps = {
	buttons: ToggleButton[];
	className?: string;
	onReorder: ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => void;
	excludeFromDrag?: string[]; // Button names that should not be draggable
};

export const DraggableToggleButtonGroup = ({
	buttons,
	className,
	onReorder,
	excludeFromDrag = [],
}: DraggableToggleButtonGroupProps) => {
	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		const sourceIndex = result.source.index;
		const destIndex = result.destination.index;

		if (sourceIndex === destIndex) return;

		onReorder({ fromIndex: sourceIndex, toIndex: destIndex });
	};

	// Separate draggable and non-draggable buttons
	const draggableButtons = buttons.filter(
		(button) => !excludeFromDrag.includes(button.name),
	);
	const nonDraggableButtons = buttons.filter((button) =>
		excludeFromDrag.includes(button.name),
	);

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Droppable droppableId="toggle-buttons" direction="horizontal">
				{(provided) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className={cn(
							"inline-flex items-center gap-1",
							"rounded-full",
							"border border-[hsl(var(--color-border))]",
							"bg-[hsl(var(--color-background))]",
							"px-2 py-1.5",
							"shadow-lg",
							className,
						)}
					>
						{/* Render non-draggable buttons first (e.g., collapse toggle on left for project) */}
						{nonDraggableButtons
							.filter((button) => buttons.indexOf(button) === 0)
							.map((button) => (
								<Button
									key={button.name}
									onClick={button.onClick}
									variant={button.isActive ? "default" : "ghost"}
									size="icon-sm"
									aria-label={button.tooltip || button.name}
									title={button.tooltip || button.name}
								>
									<button.icon className="h-4 w-4" />
								</Button>
							))}

						{/* Render draggable buttons */}
						{draggableButtons.map((button, index) => (
							<Draggable
								key={button.name}
								draggableId={button.name}
								index={index}
							>
								{(provided, snapshot) => (
									// biome-ignore lint/a11y/useSemanticElements: div required for react-dnd drag handle
									<div
										ref={provided.innerRef}
										{...provided.draggableProps}
										{...provided.dragHandleProps}
										role="button"
										tabIndex={0}
										className={cn(
											snapshot.isDragging && "opacity-50",
											"cursor-grab active:cursor-grabbing",
										)}
										onClick={() => {
											// Only trigger button click if not dragging
											if (!snapshot.isDragging) {
												button.onClick();
											}
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												if (!snapshot.isDragging) {
													button.onClick();
												}
											}
										}}
									>
										<Button
											variant={button.isActive ? "default" : "ghost"}
											size="icon-sm"
											aria-label={button.tooltip || button.name}
											title={button.tooltip || button.name}
											className="pointer-events-none"
										>
											<button.icon className="h-4 w-4" />
										</Button>
									</div>
								)}
							</Draggable>
						))}

						{/* Render non-draggable buttons last (e.g., collapse toggle on right for page) */}
						{nonDraggableButtons
							.filter(
								(button) => buttons.indexOf(button) === buttons.length - 1,
							)
							.map((button) => (
								<Button
									key={button.name}
									onClick={button.onClick}
									variant={button.isActive ? "default" : "ghost"}
									size="icon-sm"
									aria-label={button.tooltip || button.name}
									title={button.tooltip || button.name}
								>
									<button.icon className="h-4 w-4" />
								</Button>
							))}

						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};
