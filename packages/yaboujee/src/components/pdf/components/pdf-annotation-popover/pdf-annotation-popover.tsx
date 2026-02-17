"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { POPOVER_ANIMATION_CLASSES } from "../../../../constants/popover-classes";

export type PdfAnnotationPopoverProps = {
	/** The element to position relative to (usually the draft highlight) */
	anchorElement: HTMLElement | null;
	/** Whether the popover is open */
	isOpen: boolean;
	/** Callback when user presses escape or clicks backdrop */
	onCancel: () => void;
	/** Optional callback to check if closing should be prevented (e.g., when a modal is open) */
	shouldPreventClose?: () => boolean;
	/** Custom z-index for the positioner (default: 50) - useful when a modal needs to be above this popover */
	zIndex?: number;
	/** The content to render inside the popover */
	children: React.ReactNode;
};

/**
 * Generic popover for PDF annotations
 *
 * Automatically positions itself next to the anchor element (usually a draft highlight)
 * with smart bounds checking to stay on screen.
 *
 * Now uses Base UI Popover for automatic positioning, scroll handling, and accessibility.
 */
export const PdfAnnotationPopover = ({
	anchorElement,
	isOpen,
	onCancel,
	shouldPreventClose,
	zIndex = 50,
	children,
}: PdfAnnotationPopoverProps) => {
	// Don't render until we have an anchor element to position against
	if (!isOpen || !anchorElement) return null;

	return (
		<PopoverPrimitive.Root
			open={isOpen}
			onOpenChange={(open) => {
				// Check if any modal dialog is currently open in the DOM
				const hasOpenModal =
					document.querySelector("[data-modal-dialog]") !== null;

				const shouldPrevent = shouldPreventClose?.() || hasOpenModal;
				console.log("[PdfAnnotationPopover] onOpenChange:", {
					open,
					shouldPreventFromCallback: shouldPreventClose?.(),
					hasOpenModal,
					shouldPrevent,
					willCancel: !open && !shouldPrevent,
				});
				if (!open && !shouldPrevent) {
					onCancel();
				}
			}}
		>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner
					anchor={anchorElement}
					side="right"
					sideOffset={10}
					collisionBoundary={document.body}
					collisionPadding={10}
					className="isolate"
					style={{ zIndex }}
				>
					<PopoverPrimitive.Popup
						data-pdf-annotation-popover
						className={`${POPOVER_ANIMATION_CLASSES} w-80 p-4 shadow-2xl`}
					>
						{children}
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
};
