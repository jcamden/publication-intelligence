"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Button } from "@pubint/yabasic/components/ui/button";

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
	const truncatedText =
		selectedText.length > 60
			? `${selectedText.substring(0, 60)}...`
			: selectedText;

	return (
		<PopoverPrimitive.Root open={true}>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner
					anchor={anchorEl}
					side="bottom"
					sideOffset={8}
					className="isolate z-50"
				>
					<PopoverPrimitive.Popup
						data-slot="popover-content"
						className="bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 duration-100 z-50 w-auto origin-(--transform-origin) outline-hidden"
					>
						<div className="mb-2 max-w-xs text-xs text-muted-foreground">
							"{truncatedText}"
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								onClick={onCreateMention}
								disabled={isCreating}
								variant="default"
								size="sm"
							>
								{isCreating ? "Creating..." : "Create Mention"}
							</Button>
							<Button
								type="button"
								onClick={onCancel}
								disabled={isCreating}
								variant="outline"
								size="sm"
							>
								Cancel
							</Button>
						</div>
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
};
