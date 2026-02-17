import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@pubint/yabasic/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ReactNode } from "react";

const modalVariants = cva(
	"w-full bg-card rounded-lg shadow-xl flex flex-col max-h-[90vh]",
	{
		variants: {
			size: {
				sm: "max-w-sm",
				md: "max-w-md",
				lg: "max-w-lg",
				xl: "max-w-xl",
				"2xl": "max-w-2xl",
				full: "max-w-full mx-4",
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
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => {
				console.log("[Modal] onOpenChange:", {
					nextOpen,
					willClose: !nextOpen,
				});
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
					<Dialog.Popup
						data-modal-dialog
						className={clsx(
							modalVariants({ size }),
							className,
							"pointer-events-auto",
						)}
						onPointerDown={(e) => e.stopPropagation()}
						onPointerUp={(e) => e.stopPropagation()}
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
						onMouseUp={(e) => e.stopPropagation()}
					>
						{title && (
							<div className="flex items-center justify-between px-6 py-4 border-b border-border">
								<Dialog.Title className="text-xl font-semibold text-foreground">
									{title}
								</Dialog.Title>
								{showCloseButton && (
									<Dialog.Close
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
							</div>
						)}
						<div className="px-6 py-4 text-foreground overflow-y-auto flex-1">
							{children}
						</div>
						{footer && (
							<div className="px-6 py-4 border-t border-border flex justify-end gap-3">
								{footer}
							</div>
						)}
					</Dialog.Popup>
				</div>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
