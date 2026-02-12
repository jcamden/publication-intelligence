import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@pubint/yabasic/lib/utils";
import * as React from "react";

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
	viewportRef?: React.Ref<HTMLDivElement>;
};

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
	({ className, children, viewportRef, ...props }, ref) => {
		return (
			<ScrollAreaPrimitive.Root
				data-slot="scroll-area"
				className={cn("relative overflow-hidden", className)}
				ref={ref}
				{...props}
			>
				<ScrollAreaPrimitive.Viewport
					data-slot="scroll-area-viewport"
					className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 overflow-auto"
					ref={viewportRef}
				>
					{children}
				</ScrollAreaPrimitive.Viewport>
				<ScrollBar orientation="vertical" />
				<ScrollBar orientation="horizontal" />
				<ScrollAreaPrimitive.Corner />
			</ScrollAreaPrimitive.Root>
		);
	},
);
ScrollArea.displayName = "ScrollArea";

function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
	return (
		<ScrollAreaPrimitive.Scrollbar
			data-slot="scroll-area-scrollbar"
			data-orientation={orientation}
			orientation={orientation}
			className={cn(
				"data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px transition-colors select-none z-10",
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				data-slot="scroll-area-thumb"
				className="rounded-full bg-neutral-400 dark:bg-neutral-600 relative flex-1"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };
