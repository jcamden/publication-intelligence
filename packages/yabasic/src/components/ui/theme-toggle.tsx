"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Moon, Sun } from "lucide-react";

export type Theme = "light" | "dark";

export type ThemeToggleProps = {
	theme: Theme;
	onToggle: () => void;
	className?: string;
};

export const ThemeToggle = ({
	theme,
	onToggle,
	className,
}: ThemeToggleProps) => {
	return (
		<Button
			variant="outline"
			size="icon"
			onClick={onToggle}
			className={className}
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
		>
			{theme === "light" ? (
				<Moon className="size-5" />
			) : (
				<Sun className="size-5" />
			)}
		</Button>
	);
};
