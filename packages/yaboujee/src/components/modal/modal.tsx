import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@pubint/yabasic/components/ui/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ReactNode } from "react";

const modalVariants = cva(
	"w-full bg-card rounded-lg shadow-xl flex flex-col max-h-[90vh]",
	{
		variants: {
			size: {
				sm: "max-w-sm sm:max-w-sm",
				md: "max-w-md sm:max-w-md",
				lg: "max-w-lg sm:max-w-lg",
				xl: "max-w-xl sm:max-w-xl",
				"2xl": "max-w-2xl sm:max-w-2xl",
				"3xl": "max-w-3xl sm:max-w-3xl",
				"4xl": "max-w-4xl sm:max-w-4xl",
				"5xl": "max-w-5xl sm:max-w-5xl",
				full: "max-w-full mx-4 sm:max-w-full",
			},
		},
		defaultVariants: {
			size: "md",
		},
	},
);

export type ModalProps = VariantProps<typeof modalVariants> & {
	open: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	showCloseButton?: boolean;
	footer?: ReactNode;
	className?: string;
};

export const Modal = ({
	open,
	onClose,
	title,
	children,
	size,
	showCloseButton = true,
	footer,
	className,
}: ModalProps) => {
	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<DialogContent
				data-modal-dialog
				className={clsx(modalVariants({ size }), "!p-0 !gap-0", className)}
				showCloseButton={!title && showCloseButton}
				onPointerDown={(e) => e.stopPropagation()}
				onPointerUp={(e) => e.stopPropagation()}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
				onMouseUp={(e) => e.stopPropagation()}
			>
				{title && (
					<DialogHeader className="flex flex-row items-center justify-between gap-2 px-6 py-4 border-b border-border">
						<DialogTitle className="text-xl font-semibold text-foreground">
							{title}
						</DialogTitle>
						{showCloseButton && (
							<DialogClose
								render={
									<Button
										variant="ghost"
										size="xs"
										onClick={onClose}
										className="!p-2"
									>
										✕
									</Button>
								}
							/>
						)}
					</DialogHeader>
				)}
				<div className="px-6 py-4 text-foreground overflow-y-auto flex-1">
					{children}
				</div>
				{footer && (
					<DialogFooter className="!mx-0 !mb-0 bg-transparent px-6 py-4 border-t border-border flex justify-end gap-3 rounded-b-lg">
						{footer}
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};
