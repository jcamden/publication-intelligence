"use client";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@pubint/yabasic/components/ui/accordion";
import {
	ChevronDown,
	GripVertical,
	type LucideIcon,
	SquareArrowOutUpLeft,
	SquareArrowOutUpRight,
	SquareDashedMousePointer,
	TextSelect,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatOklchColor } from "../../../../utils/index-type-colors";
import { StyledButton } from "../../../styled-button";

type ActionButtons = {
	indexType: string;
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
};

type SidebarAccordionItemProps = {
	value: string;
	title: string;
	icon: LucideIcon;
	onPop: () => void;
	children: ReactNode;
	dragHandleProps?: DraggableProvidedDragHandleProps | null;
	index: number;
	side: "left" | "right";
	actionButtons?: ActionButtons;
	isExpanded: boolean;
	onToggle: () => void;
	headerColorHue?: number; // Hue value 0-360
	isDarkMode?: boolean; // Optional dark mode flag from parent
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
	actionButtons,
	isExpanded,
	onToggle,
	headerColorHue,
	isDarkMode = false,
}: SidebarAccordionItemProps) => {
	// Compute header background color from hue with specific lightness/chroma for accordion headers
	// Use lower lightness in dark mode for better contrast
	const headerBackgroundColor = headerColorHue
		? formatOklchColor({
				hue: headerColorHue,
				lightness: isDarkMode ? 0.5 : 0.95, // Darker in dark mode, very light in light mode
				chroma: 0.2, // Low saturation for subtle color
				alpha: isDarkMode ? 0.15 : 0.1,
			})
		: undefined;

	const contentBackgroundColor = headerColorHue
		? formatOklchColor({
				hue: headerColorHue,
				lightness: isDarkMode ? 0.5 : 0.95, // Darker in dark mode, very light in light mode
				chroma: 0.2, // Low saturation for subtle color
				alpha: isDarkMode ? 0.075 : 0.05,
			})
		: undefined;

	const PopIcon =
		side === "right" ? SquareArrowOutUpLeft : SquareArrowOutUpRight;

	const isSelectTextActive =
		actionButtons &&
		actionButtons.activeAction.type === "select-text" &&
		actionButtons.activeAction.indexType === actionButtons.indexType;
	const isDrawRegionActive =
		actionButtons &&
		actionButtons.activeAction.type === "draw-region" &&
		actionButtons.activeAction.indexType === actionButtons.indexType;

	return (
		<AccordionItem value={value}>
			<div
				className={`flex items-center justify-between gap-2 shadow-sm p-2 ${side === "right" ? "flex-row-reverse" : ""} ${index !== 0 ? "border-t" : ""}`}
				style={
					headerBackgroundColor
						? { backgroundColor: headerBackgroundColor }
						: undefined
				}
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
				{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper for stopPropagation */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper for stopPropagation */}
				<div
					className="flex items-center gap-2 shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<StyledButton
						icon={ChevronDown}
						label={isExpanded ? "Collapse" : "Expand"}
						isActive={isExpanded}
						onClick={onToggle}
					/>
					<StyledButton
						icon={PopIcon}
						label="Pop out to window"
						isActive={false}
						onClick={onPop}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<AccordionTrigger
						className={`w-full h-full hover:cursor-pointer rounded-none flex [&_[data-slot=accordion-trigger-icon]]:hidden ${side === "right" ? "flex-row-reverse justify-between" : ""}`}
					>
						<div
							className={`flex items-center justify-center gap-2 w-full h-full ${side === "right" ? "flex-row-reverse" : ""}`}
						>
							<Icon className="h-4 w-4 shrink-0" />
							<span className="truncate">{title}</span>
						</div>
					</AccordionTrigger>
				</div>
				{actionButtons && (
					<>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper for stopPropagation */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper for stopPropagation */}
						<div
							className="flex items-center gap-2 shrink-0"
							onClick={(e) => e.stopPropagation()}
						>
							<StyledButton
								icon={TextSelect}
								label="Select Text"
								isActive={!!isSelectTextActive}
								onClick={() =>
									actionButtons.onSelectText({
										indexType: actionButtons.indexType,
									})
								}
							/>
							<StyledButton
								icon={SquareDashedMousePointer}
								label="Draw Region"
								isActive={!!isDrawRegionActive}
								onClick={() =>
									actionButtons.onDrawRegion({
										indexType: actionButtons.indexType,
									})
								}
							/>
						</div>
					</>
				)}
			</div>
			<AccordionContent
				style={{ backgroundColor: contentBackgroundColor }}
				className={"p-3"}
			>
				{children}
			</AccordionContent>
		</AccordionItem>
	);
};
