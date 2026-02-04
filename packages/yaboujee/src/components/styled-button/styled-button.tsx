"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@pubint/yabasic/components/ui/tooltip";
import { cn } from "@pubint/yabasic/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StyledButtonProps = {
	icon: LucideIcon;
	label: string;
	isActive: boolean;
	onClick: () => void;
	tooltip?: string;
	className?: string;
};

/**
 * Styled Button Component
 *
 * A button with sophisticated ring and shadow effects for both light and dark modes.
 * Extracted from StyledToggleButtonGroup for standalone use.
 *
 * ## Features
 * - Icon-based button with tooltip
 * - Sophisticated active/inactive state styling
 * - Ring and shadow effects for light/dark modes
 * - Hover effects
 * - Tooltip support
 *
 * ## Styling Details
 * - **Inactive state (light)**: Ring + shadow
 * - **Inactive state (dark)**: Shadow only
 * - **Active state (light)**: No ring/shadow
 * - **Active state (dark)**: Ring, no shadow
 * - **Hover (both)**: Ring effect
 */
export const StyledButton = ({
	icon: Icon,
	label,
	isActive,
	onClick,
	tooltip,
	className,
}: StyledButtonProps) => {
	const tooltipContent = tooltip || label;

	return (
		<Tooltip delay={500}>
			<TooltipTrigger
				render={
					/* biome-ignore lint/a11y/useSemanticElements: div required for styling wrapper */
					<div
						role="button"
						tabIndex={0}
						aria-label={tooltipContent}
						className={cn(
							"group rounded-lg transition-all cursor-pointer",
							// Inactive state - ring + shadow in light, shadow in dark
							!isActive &&
								"!ring-1 !ring-neutral-100 !shadow-md dark:!ring-neutral-700",
							!isActive && "dark:!shadow-none",
							// Active state - no ring/shadow in light, ring in dark
							isActive &&
								"!ring-1 ring-neutral-300 dark:!ring-neutral-700 dark:!shadow-none",
							// Hover ring (both states)
							"hover:!ring-1 hover:!ring-neutral-300 dark:hover:!ring-1 dark:hover:!ring-neutral-200",
							className,
						)}
						onClick={onClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onClick();
							}
						}}
					>
						<Button
							variant={isActive ? "secondary" : "ghost"}
							size="icon-lg"
							className={cn(
								"pointer-events-none border-none rounded-lg",
								isActive &&
									"bg-neutral-100 group-hover:bg-neutral-200 !shadow-none dark:bg-transparent dark:group-hover:bg-transparent dark:!shadow-none",
								!isActive &&
									"!shadow-none dark:bg-neutral-700 dark:group-hover:bg-neutral-700 dark:!shadow-sm dark:shadow-neutral-400/50",
							)}
						>
							<Icon
								className={cn(
									"h-5 w-5 text-neutral-500 dark:text-neutral-200",
									isActive &&
										"text-[color:hsl(204,80.00%,60.00%)] dark:text-cyan-200 dark:drop-shadow-[0_0_2px_rgba(6,182,212,1)]",
								)}
								strokeWidth={isActive ? 3 : 2}
							/>
						</Button>
					</div>
				}
			/>
			<TooltipContent>{tooltipContent}</TooltipContent>
		</Tooltip>
	);
};
