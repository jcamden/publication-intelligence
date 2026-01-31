"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { X } from "lucide-react";

type CloseButtonProps = {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
};

export const CloseButton = ({
	onClick,
	disabled = false,
	className,
}: CloseButtonProps) => {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={disabled}
			aria-label="Close"
			className={className}
		>
			<X className="h-4 w-4" />
		</Button>
	);
};
