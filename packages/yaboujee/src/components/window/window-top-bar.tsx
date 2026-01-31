"use client";

import { MaximizeButton, UnpopButton } from "../icon-button";

type WindowTopBarProps = {
	title: string;
	isMaximized: boolean;
	sidebarCollapsed: boolean;
	onUnpop: () => void;
	onMaximize: () => void;
};

export const WindowTopBar = ({
	title,
	isMaximized,
	sidebarCollapsed,
	onUnpop,
	onMaximize,
}: WindowTopBarProps) => {
	return (
		<div className="flex items-center justify-between sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 drag-handle cursor-grab active:cursor-grabbing px-3 py-2">
			<h3 className="text-sm font-medium">{title}</h3>
			<div className="flex gap-1">
				<MaximizeButton isMaximized={isMaximized} onClick={onMaximize} />
				<UnpopButton onClick={onUnpop} disabled={sidebarCollapsed} />
			</div>
		</div>
	);
};
