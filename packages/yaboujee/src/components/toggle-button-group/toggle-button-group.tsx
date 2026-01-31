"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { cn } from "@pubint/yabasic/lib/utils";
import type { LucideIcon } from "lucide-react";

export type ToggleButton = {
	name: string;
	icon: LucideIcon;
	isActive: boolean;
	onClick: () => void;
	tooltip?: string;
};

export type ToggleButtonGroupProps = {
	buttons: ToggleButton[];
	className?: string;
};

/**
 * Toggle Button Group Component
 *
 * A horizontal group of toggle buttons with icons, commonly used for
 * controlling sidebar panel visibility.
 *
 * ## Features
 * - Icon-based toggle buttons
 * - Active state styling
 * - Tooltip support
 * - Dock-style design with rounded corners
 *
 * ## Usage
 * ```tsx
 * <ToggleButtonGroup
 *   buttons={[
 *     { name: "pages", icon: FileIcon, isActive: true, onClick: () => {} },
 *     { name: "subject", icon: TagIcon, isActive: false, onClick: () => {} },
 *   ]}
 * />
 * ```
 */
export const ToggleButtonGroup = ({
	buttons,
	className,
}: ToggleButtonGroupProps) => {
	return (
		<div
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
			{buttons.map((button) => (
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
		</div>
	);
};
