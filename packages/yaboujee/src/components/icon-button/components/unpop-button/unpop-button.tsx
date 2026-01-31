"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { SquareArrowDownLeft, SquareArrowDownRight } from "lucide-react";

type UnpopButtonProps = {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
	side: "left" | "right";
};

export const UnpopButton = ({
	onClick,
	disabled = false,
	className,
	side,
}: UnpopButtonProps) => {
	const Icon = side === "right" ? SquareArrowDownRight : SquareArrowDownLeft;

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
			<Icon className="h-4 w-4" />
		</Button>
	);
};
