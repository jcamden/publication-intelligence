"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@pubint/yabasic/components/ui/tooltip";
import { cn } from "@pubint/yabasic/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StyledTextButtonProps = {
	icon: LucideIcon;
	children: ReactNode;
	onClick: () => void;
	tooltip?: string;
	disabled?: boolean;
	disabledTooltip?: string;
	className?: string;
};

/**
 * Styled Text Button Component
 *
 * A button with icon + text that matches StyledButton's height (h-9), icon size (h-5 w-5),
 * and ring/shadow styling. Use for actions that need a text label alongside the icon.
 */
export const StyledTextButton = ({
	icon: Icon,
	children,
	onClick,
	tooltip,
	disabled = false,
	disabledTooltip,
	className,
}: StyledTextButtonProps) => {
	const tooltipContent = disabled ? (disabledTooltip ?? tooltip) : tooltip;

	const button = (
		/* biome-ignore lint/a11y/useSemanticElements: div required for styling wrapper */
		<div
			role="button"
			tabIndex={disabled ? -1 : 0}
			aria-label={tooltipContent}
			className={cn(
				"group rounded-lg transition-all",
				!disabled && "cursor-pointer",
				disabled && "opacity-50 cursor-not-allowed",
				// Inactive state - ring + shadow in light, shadow in dark (matches StyledButton)
				"!ring-1 !ring-neutral-100 !shadow-md dark:!ring-neutral-700",
				"dark:!shadow-none",
				// Hover ring
				!disabled &&
					"hover:!ring-1 hover:!ring-neutral-300 dark:hover:!ring-1 dark:hover:!ring-neutral-200",
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
				variant="ghost"
				size="lg"
				className={cn(
					"pointer-events-none border-none rounded-lg h-9 gap-1.5 px-2.5",
					"!shadow-none dark:bg-neutral-700 dark:group-hover:bg-neutral-700 dark:!shadow-sm dark:shadow-neutral-400/50",
				)}
				disabled={disabled}
			>
				<Icon
					className="size-6 shrink-0 text-neutral-500 dark:text-neutral-200"
					strokeWidth={2}
				/>
				<span className="text-sm font-medium font-thin text-center w-full">
					{children}
				</span>
			</Button>
		</div>
	);

	if (tooltipContent) {
		return (
			<Tooltip delay={500}>
				<TooltipTrigger
					render={
						<span
							className={
								disabled ? "inline-flex cursor-not-allowed" : undefined
							}
						>
							{button}
						</span>
					}
				/>
				<TooltipContent>{tooltipContent}</TooltipContent>
			</Tooltip>
		);
	}

	return button;
};
