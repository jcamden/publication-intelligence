"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@pubint/yabasic/components/ui/popover";
import { cn } from "@pubint/yabasic/lib/utils";
import { useEffect, useState } from "react";

export type OklchColor = {
	hue: number; // 0-360
};

/**
 * Max values for preview to help user see the hue clearly
 * Actual lightness/chroma are controlled programmatically where colors are used
 */
const PREVIEW_LIGHTNESS = 0.85;
const PREVIEW_CHROMA = 0.25;

const formatOklch = ({
	lightness,
	chroma,
	hue,
}: {
	lightness: number;
	chroma: number;
	hue: number;
}): string => `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;

export type OklchColorPickerProps = {
	value: OklchColor;
	onChange: (color: OklchColor) => void;
	label?: string;
	className?: string;
};

export const OklchColorPicker = ({
	value,
	onChange,
	label = "Choose color",
	className,
}: OklchColorPickerProps) => {
	const [open, setOpen] = useState(false);
	const [localValue, setLocalValue] = useState(value);

	// Sync localValue with incoming value prop
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Use maxed out chroma/lightness for preview so user can clearly see the hue
	const previewColor = formatOklch({
		hue: localValue.hue,
		chroma: PREVIEW_CHROMA,
		lightness: PREVIEW_LIGHTNESS,
	});

	const handleChange = (hue: number) => {
		const newValue = { hue };
		setLocalValue(newValue);
		onChange(newValue);
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange} modal={false}>
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
				<span
					className="size-4 rounded border border-border inline-block"
					style={{ backgroundColor: previewColor }}
				/>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				side="bottom"
				className="w-[280px]"
				onPointerDown={(e) => {
					e.stopPropagation();
				}}
				onClick={(e) => {
					e.stopPropagation();
				}}
			>
				<div className="flex flex-col gap-4">
					{/* Hue slider */}
					<div className="flex flex-col gap-2">
						<label htmlFor="hue-slider" className="text-sm font-medium">
							Choose hue: {Math.round(localValue.hue)}°
						</label>
						<input
							id="hue-slider"
							type="range"
							min="0"
							max="360"
							value={localValue.hue}
							onChange={(e) => {
								handleChange(parseFloat(e.target.value));
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							onClick={(e) => {
								e.stopPropagation();
							}}
							onMouseDown={(e) => {
								e.stopPropagation();
							}}
							className="w-full"
							style={{
								background: `linear-gradient(to right, 
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 0),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 60),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 120),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 180),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 240),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 300),
									oklch(${PREVIEW_LIGHTNESS} ${PREVIEW_CHROMA} 360)
								)`,
							}}
						/>
					</div>

					{/* Preview */}
					<div className="flex flex-col gap-2">
						<div className="text-sm font-medium">Preview</div>
						<div
							className="h-16 rounded border border-border"
							style={{ backgroundColor: previewColor }}
						/>
						<div className="text-xs text-muted-foreground">
							Lightness and saturation will be adjusted automatically based on
							context
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
