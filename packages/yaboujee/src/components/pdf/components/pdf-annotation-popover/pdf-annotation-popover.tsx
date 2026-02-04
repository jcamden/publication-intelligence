"use client";

import { useEffect, useRef, useState } from "react";

export type PdfAnnotationPopoverProps = {
	/** The element to position relative to (usually the draft highlight) */
	anchorElement: HTMLElement | null;
	/** Whether the popover is open */
	isOpen: boolean;
	/** Callback when user presses escape or clicks backdrop */
	onCancel: () => void;
	/** The content to render inside the popover */
	children: React.ReactNode;
};

/**
 * Generic popover for PDF annotations
 *
 * Automatically positions itself next to the anchor element (usually a draft highlight)
 * with smart bounds checking to stay on screen.
 */
export const PdfAnnotationPopover = ({
	anchorElement,
	isOpen,
	onCancel,
	children,
}: PdfAnnotationPopoverProps) => {
	const popoverRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{ x: number; y: number } | null>(
		null,
	);

	// Reset position when closing or anchor changes
	useEffect(() => {
		if (!isOpen || !anchorElement) {
			setPosition(null);
		}
	}, [isOpen, anchorElement]);

	// Update position when anchor element or popover size changes
	useEffect(() => {
		if (!isOpen || !anchorElement || !popoverRef.current) return;

		const updatePosition = () => {
			if (!anchorElement || !popoverRef.current) return;

			const anchorRect = anchorElement.getBoundingClientRect();
			const popoverRect = popoverRef.current.getBoundingClientRect();

			// Position to the right and slightly below
			let x = anchorRect.right + 10; // 10px gap
			let y = anchorRect.top;

			// If would go off right edge, position to the left
			if (x + popoverRect.width > window.innerWidth) {
				x = anchorRect.left - popoverRect.width - 10;
			}

			// If still off left edge, position at window edge
			if (x < 10) {
				x = 10;
			}

			// Ensure doesn't go off bottom
			if (y + popoverRect.height > window.innerHeight) {
				y = window.innerHeight - popoverRect.height - 10;
			}

			// Ensure doesn't go off top
			if (y < 10) {
				y = 10;
			}

			setPosition({ x, y });
		};

		// Initial position
		updatePosition();

		// Update on scroll/resize
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);

		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [isOpen, anchorElement]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onCancel]);

	// Focus popover when it opens
	useEffect(() => {
		if (isOpen && popoverRef.current) {
			popoverRef.current.focus();
		}
	}, [isOpen]);

	// Handle click outside to close
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;

			// Don't close if clicking inside the popover
			if (popoverRef.current?.contains(target)) {
				return;
			}

			// Don't close if clicking inside a portaled element (like Select dropdown)
			if (
				target.closest('[role="listbox"]') ||
				target.closest('[role="menu"]') ||
				target.closest("[data-radix-popper-content-wrapper]") ||
				target.closest("[data-radix-select-content]")
			) {
				return;
			}

			// Clicking outside - close the popover
			onCancel();
		};

		// Use capture phase to handle clicks before they bubble
		document.addEventListener("mousedown", handleClickOutside, true);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside, true);
	}, [isOpen, onCancel]);

	// Don't render until we have an anchor element to position against
	if (!isOpen || !anchorElement) return null;

	return (
		<div
			ref={popoverRef}
			data-pdf-annotation-popover
			role="dialog"
			tabIndex={-1}
			className="fixed z-50 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/20 p-4 w-80 transition-opacity duration-100 outline-none"
			style={{
				top: position?.y ?? 0,
				left: position?.x ?? 0,
				opacity: position ? 1 : 0,
			}}
		>
			{children}
		</div>
	);
};
