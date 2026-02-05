"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

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
 *
 * Now uses Base UI Popover for automatic positioning, scroll handling, and accessibility.
 */
export const PdfAnnotationPopover = ({
	anchorElement,
	isOpen,
	onCancel,
	children,
}: PdfAnnotationPopoverProps) => {
	// Don't render until we have an anchor element to position against
	if (!isOpen || !anchorElement) return null;

	return (
		<PopoverPrimitive.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner
					anchor={anchorElement}
					side="right"
					sideOffset={10}
					collisionBoundary={document.body}
					collisionPadding={10}
					className="isolate z-50"
				>
					<PopoverPrimitive.Popup
						data-pdf-annotation-popover
						role="dialog"
						className="bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-2.5 rounded-lg p-4 text-sm shadow-2xl ring-1 duration-100 z-50 w-80 origin-(--transform-origin) outline-hidden"
					>
						{children}
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
};
