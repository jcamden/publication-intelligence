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
};

export const SidebarAccordionItem = ({
	value,
	title,
	icon: Icon,
	onPop,
	children,
	dragHandleProps,
}: SidebarAccordionItemProps) => {
	return (
		<AccordionItem value={value}>
			<div className="flex items-center gap-2">
				{dragHandleProps && (
					// biome-ignore lint/a11y/useSemanticElements: drag handle from react-beautiful-dnd requires div
					// biome-ignore lint/a11y/useKeyWithClickEvents: drag controlled by react-beautiful-dnd
					<div
						{...dragHandleProps}
						className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center"
						onClick={(e) => e.stopPropagation()}
						role="button"
						tabIndex={0}
						aria-label="Drag to reorder"
					>
						<GripVertical className="h-4 w-4" />
					</div>
				)}
				<AccordionTrigger className="flex-1">
					<div className="flex items-center gap-2">
						<Icon className="h-4 w-4" />
						<span>{title}</span>
					</div>
				</AccordionTrigger>
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
					<SquareArrowOutUpRight className="h-4 w-4" />
				</Button>
			</div>
			<AccordionContent>{children}</AccordionContent>
		</AccordionItem>
	);
};
