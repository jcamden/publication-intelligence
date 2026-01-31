"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { SquareArrowDownLeft } from "lucide-react";

type UnpopButtonProps = {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
};

export const UnpopButton = ({
	onClick,
	disabled = false,
	className,
}: UnpopButtonProps) => {
	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={disabled}
			aria-label="Return to sidebar"
			className={className}
		>
			<SquareArrowDownLeft className="h-4 w-4" />
		</Button>
	);
};
