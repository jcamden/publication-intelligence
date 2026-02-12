"use client";

import { cn } from "@pubint/yabasic/lib/utils";
import { Circle } from "lucide-react";
import * as React from "react";

type RadioGroupContextValue = {
	value?: string;
	onValueChange?: (value: string) => void;
	name?: string;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

type RadioGroupProps = {
	value?: string;
	onValueChange?: (value: string) => void;
	name?: string;
	className?: string;
	children?: React.ReactNode;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
	({ className, value, onValueChange, name, children, ...props }, ref) => {
		return (
			<RadioGroupContext.Provider value={{ value, onValueChange, name }}>
				<div ref={ref} className={cn("grid gap-2", className)} {...props}>
					{children}
				</div>
			</RadioGroupContext.Provider>
		);
	},
);
RadioGroup.displayName = "RadioGroup";

type RadioGroupItemProps = Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange"
>;

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
	({ className, value, id, ...props }, ref) => {
		const context = React.useContext(RadioGroupContext);
		const isChecked = context.value === value;

		return (
			<div className="relative inline-flex items-center justify-center">
				<input
					type="radio"
					ref={ref}
					id={id}
					value={value}
					name={context.name}
					checked={isChecked}
					onChange={(e) => {
						if (e.target.checked && value) {
							context.onValueChange?.(value.toString());
						}
					}}
					className="sr-only peer"
					{...props}
				/>
				<div
					className={cn(
						"aspect-square h-4 w-4 rounded-full border border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50 ring-offset-white dark:ring-offset-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:border-zinc-900 dark:peer-checked:border-zinc-50 flex items-center justify-center",
						className,
					)}
				>
					{isChecked && (
						<Circle className="h-2.5 w-2.5 fill-current text-current" />
					)}
				</div>
			</div>
		);
	},
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
