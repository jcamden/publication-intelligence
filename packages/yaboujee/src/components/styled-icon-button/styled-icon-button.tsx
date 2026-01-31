"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { cn } from "@pubint/yabasic/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StyledIconButtonProps = {
	icon: LucideIcon;
	onClick: () => void;
	isActive?: boolean;
	disabled?: boolean;
	tooltip?: string;
	size?: "sm" | "lg";
	className?: string;
};

/**
 * Styled Icon Button Component
 *
 * An icon button with sophisticated ring and shadow effects for both light and dark modes.
 *
 * ## Features
 * - Large or small icon sizes
 * - Sophisticated active/inactive state styling
 * - Ring and shadow effects for light/dark modes
 * - Hover effects
 * - Disabled state support
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
 * // Toggle button with active state
 * <StyledIconButton
 *   icon={Eye}
 *   onClick={() => {}}
 *   isActive={true}
 *   tooltip="Toggle visibility"
 * />
 *
 * // Regular button (no toggle state)
 * <StyledIconButton
 *   icon={Plus}
 *   onClick={() => {}}
 *   tooltip="Zoom in"
 *   size="sm"
 * />
 * ```
 */
export const StyledIconButton = ({
	icon: Icon,
	onClick,
	isActive = false,
	disabled = false,
	tooltip,
	size = "lg",
	className,
}: StyledIconButtonProps) => {
	const buttonSize = size === "lg" ? "icon-lg" : "icon-sm";
	const iconSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";
	const iconStrokeWidth = isActive ? 3 : 2;

	// Both large and small buttons get full styled treatment
	return (
		// biome-ignore lint/a11y/useSemanticElements: div required for styling wrapper
		<div
			role="button"
			tabIndex={disabled ? -1 : 0}
			className={cn(
				"group rounded-lg transition-all",
				// Cursor
				!disabled && "cursor-pointer",
				// Inactive state - ring + shadow in light, shadow in dark
				!isActive &&
					"!ring-1 !ring-neutral-100 !shadow-md dark:!ring-neutral-700",
				!isActive && "dark:!shadow-none",
				// Active state - no ring/shadow in light, ring in dark
				isActive &&
					"!ring-1 ring-neutral-300 dark:!ring-neutral-700 dark:!shadow-none",
				// Hover ring (both states)
				!disabled &&
					"hover:!ring-1 hover:!ring-neutral-300 dark:hover:!ring-1 dark:hover:!ring-neutral-200",
				// Disabled state
				disabled && "opacity-50 cursor-not-allowed",
				className,
			)}
			onClick={disabled ? undefined : onClick}
			onKeyDown={(e) => {
				if (!disabled && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onClick();
				}
			}}
		>
			<Button
				variant={isActive ? "secondary" : "ghost"}
				size={buttonSize}
				aria-label={tooltip}
				title={tooltip}
				disabled={disabled}
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
						iconSize,
						"text-neutral-500 dark:text-neutral-200",
						isActive &&
							"text-[color:hsl(204,80.00%,60.00%)] dark:text-cyan-200 dark:drop-shadow-[0_0_2px_rgba(6,182,212,1)]",
					)}
					strokeWidth={iconStrokeWidth}
				/>
			</Button>
		</div>
	);
};
