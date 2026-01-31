"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Maximize, Minimize } from "lucide-react";

type MaximizeButtonProps = {
	isMaximized: boolean;
	onClick: () => void;
	disabled?: boolean;
	className?: string;
};

export const MaximizeButton = ({
	isMaximized,
	onClick,
	disabled = false,
	className,
}: MaximizeButtonProps) => {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={disabled}
			aria-label={isMaximized ? "Restore" : "Maximize"}
			className={className}
		>
			{isMaximized ? (
				<Minimize className="h-4 w-4" />
			) : (
				<Maximize className="h-4 w-4" />
			)}
		</Button>
	);
};
