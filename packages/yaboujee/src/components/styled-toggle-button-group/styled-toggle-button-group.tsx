"use client";

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@pubint/yabasic/components/ui/button";
import { cn } from "@pubint/yabasic/lib/utils";
import type { LucideIcon } from "lucide-react";
import { StyledIconButton } from "../styled-icon-button";

export type StyledToggleButton = {
	name: string;
	icon: LucideIcon;
	isActive: boolean;
	onClick: () => void;
	tooltip?: string;
};

export type StyledToggleButtonGroupProps = {
	buttons: StyledToggleButton[];
	className?: string;
	draggable?: boolean;
	onReorder?: ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => void;
	excludeFromDrag?: string[];
};

/**
 * Styled Toggle Button Group Component
 *
 * A horizontal group of toggle buttons with sophisticated ring and shadow effects
 * for both light and dark modes. Supports optional drag-and-drop reordering.
 *
 * ## Features
 * - Icon-based toggle buttons with large icons
 * - Sophisticated active/inactive state styling
 * - Ring and shadow effects for light/dark modes
 * - Optional drag-and-drop reordering
 * - Hover effects
 * - Tooltip support
 *
 * ## Styling Details
 * - **Inactive state (light)**: Ring + shadow
 * - **Inactive state (dark)**: Shadow only
 * - **Active state (light)**: No ring/shadow
 * - **Active state (dark)**: Ring, no shadow
 * - **Hover (both)**: Ring effect
 *
 * ## Usage
 * ```tsx
 * // Non-draggable
 * <StyledToggleButtonGroup
 *   buttons={[
 *     { name: "pages", icon: FileIcon, isActive: true, onClick: () => {} },
 *     { name: "subject", icon: TagIcon, isActive: false, onClick: () => {} },
 *   ]}
 * />
 *
 * // Draggable
 * <StyledToggleButtonGroup
 *   buttons={buttons}
 *   draggable={true}
 *   onReorder={({ fromIndex, toIndex }) => reorderButtons(fromIndex, toIndex)}
 * />
 * ```
 */
export const StyledToggleButtonGroup = ({
	buttons,
	className,
	draggable = false,
	onReorder,
	excludeFromDrag = [],
}: StyledToggleButtonGroupProps) => {
	const handleDragEnd = (result: DropResult) => {
		if (!result.destination || !onReorder) return;

		const sourceIndex = result.source.index;
		const destIndex = result.destination.index;

		if (sourceIndex === destIndex) return;

		onReorder({ fromIndex: sourceIndex, toIndex: destIndex });
	};

	if (!draggable) {
		return (
			<div
				className={cn(
					"inline-flex items-center gap-2",
					"bg-[hsl(var(--color-background))]",
					"px-2 py-1.5",
					className,
				)}
			>
				{buttons.map((button) => (
					// biome-ignore lint/a11y/useSemanticElements: div required for styling wrapper
					<div
						key={button.name}
						role="button"
						tabIndex={0}
						className={cn(
							"group rounded-lg transition-all cursor-pointer",
							// Inactive state - ring + shadow in light, shadow in dark
							!button.isActive &&
								"!ring-1 !ring-neutral-100 !shadow-md dark:!ring-neutral-700",
							!button.isActive && "dark:!shadow-none",
							// Active state - no ring/shadow in light, ring in dark
							button.isActive &&
								"!ring-1 ring-neutral-300 dark:!ring-neutral-700 dark:!shadow-none",
							// Hover ring (both states)
							"hover:!ring-1 hover:!ring-neutral-300 dark:hover:!ring-1 dark:hover:!ring-neutral-200",
						)}
						onClick={button.onClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								button.onClick();
							}
						}}
					>
						<Button
							variant={button.isActive ? "secondary" : "ghost"}
							size="icon-lg"
							aria-label={button.tooltip || button.name}
							title={button.tooltip || button.name}
							className={cn(
								"pointer-events-none border-none rounded-lg",
								button.isActive &&
									"bg-neutral-100 group-hover:bg-neutral-200 !shadow-none dark:bg-transparent dark:group-hover:bg-transparent dark:!shadow-none",
								!button.isActive &&
									"!shadow-none dark:bg-neutral-700 dark:group-hover:bg-neutral-700 dark:!shadow-sm dark:shadow-neutral-400/50",
							)}
						>
							<button.icon
								className={cn(
									"h-6 w-6 text-neutral-500 dark:text-neutral-200",
									button.isActive &&
										"text-[color:hsl(204,80.00%,60.00%)] dark:text-cyan-200 dark:drop-shadow-[0_0_2px_rgba(6,182,212,1)]",
								)}
								strokeWidth={button.isActive ? 3 : 2}
							/>
						</Button>
					</div>
				))}
			</div>
		);
	}

	// Draggable version
	const draggableButtons = buttons.filter(
		(button) => !excludeFromDrag.includes(button.name),
	);
	const nonDraggableButtons = buttons.filter((button) =>
		excludeFromDrag.includes(button.name),
	);

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Droppable droppableId="styled-toggle-buttons" direction="horizontal">
				{(provided) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						className={cn(
							"inline-flex items-center gap-2",
							"bg-[hsl(var(--color-background))]",
							"px-2 py-1.5",
							className,
						)}
					>
						{/* Render non-draggable buttons first */}
						{nonDraggableButtons
							.filter((button) => buttons.indexOf(button) === 0)
							.map((button) => (
								<StyledIconButton
									key={button.name}
									icon={button.icon}
									onClick={button.onClick}
									isActive={button.isActive}
									tooltip={button.tooltip || button.name}
									size="lg"
								/>
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
											"group",
											snapshot.isDragging && "opacity-50",
											"cursor-grab active:cursor-grabbing rounded-lg transition-all",
											// Inactive state - ring + shadow in light, shadow in dark
											!button.isActive &&
												"!ring-1 !ring-neutral-100 !shadow-md dark:!ring-neutral-700",
											!button.isActive && "dark:!shadow-none",
											// Active state - no ring/shadow in light, ring in dark
											button.isActive &&
												"!ring-1 ring-neutral-300 dark:!ring-neutral-700 dark:!shadow-none",
											// Hover ring (both states) - must come after base styles to override
											"hover:!ring-1 hover:!ring-neutral-300 dark:hover:!ring-1 dark:hover:!ring-neutral-200",
										)}
										onClick={() => {
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
											variant={button.isActive ? "secondary" : "ghost"}
											size="icon-lg"
											aria-label={button.tooltip || button.name}
											title={button.tooltip || button.name}
											className={cn(
												"pointer-events-none border-none rounded-lg",
												button.isActive &&
													"bg-neutral-100 group-hover:bg-neutral-200 !shadow-none dark:bg-transparent dark:group-hover:bg-transparent dark:!shadow-none",
												!button.isActive &&
													"!shadow-none dark:bg-neutral-700 dark:group-hover:bg-neutral-700 dark:!shadow-sm dark:shadow-neutral-400/50",
											)}
										>
											<button.icon
												className={cn(
													"h-6 w-6 text-neutral-500 dark:text-neutral-200",
													button.isActive &&
														"text-[color:hsl(204,80.00%,60.00%)] dark:text-cyan-200 dark:drop-shadow-[0_0_2px_rgba(6,182,212,1)]",
												)}
												strokeWidth={button.isActive ? 3 : 2}
											/>
										</Button>
									</div>
								)}
							</Draggable>
						))}

						{/* Render non-draggable buttons last */}
						{nonDraggableButtons
							.filter(
								(button) => buttons.indexOf(button) === buttons.length - 1,
							)
							.map((button) => (
								<StyledIconButton
									key={button.name}
									icon={button.icon}
									onClick={button.onClick}
									isActive={button.isActive}
									tooltip={button.tooltip || button.name}
									size="lg"
								/>
							))}

						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
};
