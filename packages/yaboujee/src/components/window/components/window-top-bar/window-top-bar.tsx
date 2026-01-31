"use client";

import { CloseButton, MaximizeButton, UnpopButton } from "../../../icon-button";

type WindowTopBarProps = {
	title: string;
	isMaximized: boolean;
	sidebarCollapsed: boolean;
	side: "left" | "right";
	onUnpop: () => void;
	onClose: () => void;
	onMaximize: () => void;
};

export const WindowTopBar = ({
	title,
	isMaximized,
	sidebarCollapsed,
	side,
	onUnpop,
	onClose,
	onMaximize,
}: WindowTopBarProps) => {
	return (
		<div className="flex items-center justify-between sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 drag-handle cursor-grab active:cursor-grabbing px-3 py-2">
			<h3 className="text-sm font-medium">{title}</h3>
			<div className="flex gap-1">
				<MaximizeButton isMaximized={isMaximized} onClick={onMaximize} />
				{sidebarCollapsed ? (
					<CloseButton onClick={onClose} />
				) : (
					<UnpopButton onClick={onUnpop} side={side} />
				)}
			</div>
		</div>
	);
};
