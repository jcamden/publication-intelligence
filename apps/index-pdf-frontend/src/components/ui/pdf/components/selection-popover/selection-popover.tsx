"use client";

import { useEffect, useState } from "react";

type SelectionPopoverProps = {
	anchorEl: HTMLElement;
	onCreateMention: () => void;
	onCancel: () => void;
	isCreating: boolean;
	selectedText: string;
};

/**
 * Floating action button for creating mentions from text selection
 *
 * Positioned near the selection anchor point, shows:
 * - Selected text preview (truncated)
 * - "Create Mention" button
 * - Loading state during creation
 */
export const SelectionPopover = ({
	anchorEl,
	onCreateMention,
	onCancel,
	isCreating,
	selectedText,
}: SelectionPopoverProps) => {
	const [position, setPosition] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});

	useEffect(() => {
		if (!anchorEl) return;

		const rect = anchorEl.getBoundingClientRect();
		setPosition({
			top: rect.bottom + window.scrollY + 8,
			left: rect.left + window.scrollX + rect.width / 2,
		});
	}, [anchorEl]);

	const truncatedText =
		selectedText.length > 60
			? `${selectedText.substring(0, 60)}...`
			: selectedText;

	return (
		<div
			className="fixed z-50 -translate-x-1/2 rounded-lg bg-white p-3 shadow-2xl ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/20"
			style={{
				top: position.top,
				left: position.left,
			}}
		>
			<div className="mb-2 max-w-xs text-xs text-neutral-600 dark:text-neutral-400">
				"{truncatedText}"
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={onCreateMention}
					disabled={isCreating}
					className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
				>
					{isCreating ? "Creating..." : "Create Mention"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={isCreating}
					className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
				>
					Cancel
				</button>
			</div>
		</div>
	);
};
