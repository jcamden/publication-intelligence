import { Dialog } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Button } from "../Button";

const modalVariants = cva("w-full bg-surface rounded-lg shadow-xl", {
	variants: {
		size: {
			sm: "max-w-sm",
			md: "max-w-md",
			lg: "max-w-lg",
			xl: "max-w-xl",
			full: "max-w-full mx-4",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

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
			onOpenChange={(nextOpen) => !nextOpen && onClose()}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
				<Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className={clsx(modalVariants({ size }), className)}>
						{title && (
							<div className="flex items-center justify-between px-6 py-4 border-b border-border">
								<Dialog.Title className="text-xl font-semibold text-text">
									{title}
								</Dialog.Title>
								{showCloseButton && (
									<Dialog.Close
										render={
											<Button
												variant="ghost"
												size="sm"
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
						<div className="px-6 py-4 text-text">{children}</div>
						{footer && (
							<div className="px-6 py-4 border-t border-border flex justify-end gap-3">
								{footer}
							</div>
						)}
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
