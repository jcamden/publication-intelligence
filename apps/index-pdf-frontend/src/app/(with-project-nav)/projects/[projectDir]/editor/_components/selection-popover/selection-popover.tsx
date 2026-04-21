"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Button } from "@pubint/yabasic/components/ui/button";
import { POPOVER_ANIMATION_CLASSES } from "@pubint/yaboujee/constants/popover-classes";

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
						className={POPOVER_ANIMATION_CLASSES}
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
