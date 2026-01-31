"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";

type PopButtonProps = {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
};

export const PopButton = ({
	onClick,
	disabled = false,
	className,
}: PopButtonProps) => {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={disabled}
			aria-label="Pop out to window"
			className={className}
		>
			<SquareArrowOutUpRight className="h-4 w-4" />
		</Button>
	);
};
