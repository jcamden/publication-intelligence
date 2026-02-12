"use client";

import { cn } from "@pubint/yabasic/lib/utils";
import { Check } from "lucide-react";
import * as React from "react";

type CheckboxProps = Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange"
> & {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, checked, onCheckedChange, ...props }, ref) => {
		return (
			<div className="relative inline-flex items-center justify-center">
				<input
					type="checkbox"
					ref={ref}
					checked={checked}
					onChange={(e) => onCheckedChange?.(e.target.checked)}
					className="sr-only peer"
					{...props}
				/>
				<div
					className={cn(
						"h-4 w-4 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 ring-offset-white dark:ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-50 peer-checked:text-zinc-50 dark:peer-checked:text-zinc-900 flex items-center justify-center",
						className,
					)}
				>
					{checked && <Check className="h-3 w-3" />}
				</div>
			</div>
		);
	},
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
