"use client";

import { cn } from "@pubint/yabasic/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ColorPickerColor = {
	value: string;
	label: string;
};

export const DEFAULT_COLORS: ColorPickerColor[] = [
	{ value: "#fef3c7", label: "Yellow" },
	{ value: "#fde68a", label: "Amber" },
	{ value: "#fed7aa", label: "Orange" },
	{ value: "#fecaca", label: "Red" },
	{ value: "#fbcfe8", label: "Pink" },
	{ value: "#e9d5ff", label: "Purple" },
	{ value: "#ddd6fe", label: "Violet" },
	{ value: "#bfdbfe", label: "Blue" },
	{ value: "#bae6fd", label: "Sky" },
	{ value: "#a5f3fc", label: "Cyan" },
	{ value: "#99f6e4", label: "Teal" },
	{ value: "#a7f3d0", label: "Emerald" },
	{ value: "#bbf7d0", label: "Green" },
	{ value: "#d9f99d", label: "Lime" },
];

export type ColorPickerProps = {
	value: string;
	onChange: (color: string) => void;
	colors?: ColorPickerColor[];
	label?: string;
	className?: string;
};

export const ColorPicker = ({
	value,
	onChange,
	colors = DEFAULT_COLORS,
	label = "Choose color",
	className,
}: ColorPickerProps) => {
	const [open, setOpen] = useState(false);

	const selectedColor = colors.find((c) => c.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn("gap-2", className)}
						aria-label={label}
					/>
				}
			>
				<div
					className="size-4 rounded border border-border"
					style={{ backgroundColor: value }}
				/>
				<span className="text-sm">{selectedColor?.label || "Custom"}</span>
			</PopoverTrigger>

			<PopoverContent align="start" side="bottom" className="w-[280px]">
				<div className="flex flex-col gap-2">
					<div className="text-sm font-medium">{label}</div>
					<div className="grid grid-cols-7 gap-2">
						{colors.map((color) => (
							<button
								type="button"
								key={color.value}
								onClick={() => {
									onChange(color.value);
									setOpen(false);
								}}
								className={cn(
									"relative size-8 rounded border border-border transition-all hover:scale-110 hover:border-foreground",
									value === color.value &&
										"ring-ring ring-2 ring-offset-2 ring-offset-background",
								)}
								style={{ backgroundColor: color.value }}
								aria-label={color.label}
								title={color.label}
							>
								{value === color.value && (
									<Check className="absolute inset-0 m-auto size-4 text-foreground drop-shadow-sm" />
								)}
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
