"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Card } from "@pubint/yabasic/components/ui/card";
import { cn } from "@pubint/yabasic/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export type SidebarPanelProps = {
	children: ReactNode;
	title?: string;
	onClose?: () => void;
	className?: string;
};

/**
 * Sidebar Panel Component
 *
 * A reusable panel container for sidebar content with optional title and close button.
 *
 * ## Features
 * - Card-based design
 * - Optional title header
 * - Optional close button
 * - Consistent spacing and styling
 *
 * ## Usage
 * ```tsx
 * <SidebarPanel title="Page Info" onClose={() => setVisible(false)}>
 *   <div>Panel content here</div>
 * </SidebarPanel>
 * ```
 */
export const SidebarPanel = ({
	children,
	title,
	onClose,
	className,
}: SidebarPanelProps) => {
	return (
		<Card className={cn("overflow-hidden", className)}>
			{(title || onClose) && (
				<div className="flex items-center justify-between border-b border-[hsl(var(--color-border))] px-4 py-3">
					{title && (
						<h3 className="text-sm font-semibold text-[hsl(var(--color-text))]">
							{title}
						</h3>
					)}
					{onClose && (
						<Button
							onClick={onClose}
							variant="ghost"
							size="icon-sm"
							aria-label="Close panel"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			)}
			<div className="p-4">{children}</div>
		</Card>
	);
};
