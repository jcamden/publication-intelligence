"use client";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@pubint/yabasic/components/ui/accordion";
import { Button } from "@pubint/yabasic/components/ui/button";
import {
	GripVertical,
	type LucideIcon,
	SquareArrowOutUpLeft,
	SquareArrowOutUpRight,
} from "lucide-react";
import type { ReactNode } from "react";

type SidebarAccordionItemProps = {
	value: string;
	title: string;
	icon: LucideIcon;
	onPop: () => void;
	children: ReactNode;
	dragHandleProps?: DraggableProvidedDragHandleProps | null;
	index: number;
	side: "left" | "right";
};

export const SidebarAccordionItem = ({
	value,
	title,
	icon: Icon,
	onPop,
	children,
	dragHandleProps,
	index,
	side,
}: SidebarAccordionItemProps) => {
	const PopIcon =
		side === "right" ? SquareArrowOutUpLeft : SquareArrowOutUpRight;

	return (
		<AccordionItem value={value}>
			<div
				className={`flex items-center justify-between gap-2 shadow-sm px-2 ${side === "right" ? "flex-row-reverse" : ""} ${index !== 0 ? "border-t" : ""}`}
			>
				{dragHandleProps && (
					// biome-ignore lint/a11y/useSemanticElements: drag handle from react-beautiful-dnd requires div
					// biome-ignore lint/a11y/useKeyWithClickEvents: drag controlled by react-beautiful-dnd
					<div
						{...dragHandleProps}
						className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center shrink-0"
						onClick={(e) => e.stopPropagation()}
						role="button"
						tabIndex={0}
						aria-label="Drag to reorder"
					>
						<GripVertical className="h-4 w-4" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<AccordionTrigger
						className={`w-full hover:cursor-pointer rounded-none flex ${side === "right" ? "flex-row-reverse justify-between" : ""}`}
					>
						<div
							className={`flex items-center gap-2 ${side === "right" ? "w-full flex-row-reverse justify-start" : ""}`}
						>
							<Icon className="h-4 w-4" />
							<span>{title}</span>
						</div>
					</AccordionTrigger>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={(e) => {
						e.stopPropagation();
						onPop();
					}}
					aria-label="Pop out to window"
					className="shrink-0"
				>
					<PopIcon className="h-4 w-4" />
				</Button>
			</div>
			<AccordionContent>{children}</AccordionContent>
		</AccordionItem>
	);
};
