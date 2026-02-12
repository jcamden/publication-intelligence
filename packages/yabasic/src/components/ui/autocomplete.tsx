import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { cn } from "@pubint/yabasic/lib/utils";
import { ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "./input-group";

const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteValue({ ...props }: AutocompletePrimitive.Value.Props) {
	return (
		<AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />
	);
}

function AutocompleteTrigger({
	className,
	children,
	...props
}: AutocompletePrimitive.Trigger.Props) {
	return (
		<AutocompletePrimitive.Trigger
			data-slot="autocomplete-trigger"
			className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
			{...props}
		>
			{children}
			<ChevronDownIcon className="text-muted-foreground size-4 pointer-events-none" />
		</AutocompletePrimitive.Trigger>
	);
}

function AutocompleteClear({
	className,
	...props
}: AutocompletePrimitive.Clear.Props) {
	return (
		<AutocompletePrimitive.Clear
			data-slot="autocomplete-clear"
			render={<InputGroupButton variant="ghost" size="icon-xs" />}
			className={cn(className)}
			{...props}
		>
			<XIcon className="pointer-events-none" />
		</AutocompletePrimitive.Clear>
	);
}

function AutocompleteInput({
	className,
	children,
	disabled = false,
	showTrigger = true,
	showClear = false,
	...props
}: AutocompletePrimitive.Input.Props & {
	showTrigger?: boolean;
	showClear?: boolean;
}) {
	return (
		<InputGroup className={cn("w-auto", className)}>
			<AutocompletePrimitive.Input
				render={<InputGroupInput disabled={disabled} />}
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				{showTrigger && (
					<InputGroupButton
						size="icon-xs"
						variant="ghost"
						render={<AutocompleteTrigger />}
						data-slot="input-group-button"
						className="group-has-data-[slot=autocomplete-clear]/input-group:hidden data-pressed:bg-transparent"
						disabled={disabled}
					/>
				)}
				{showClear && <AutocompleteClear disabled={disabled} />}
			</InputGroupAddon>
			{children}
		</InputGroup>
	);
}

function AutocompleteContent({
	className,
	side = "bottom",
	sideOffset = 6,
	align = "start",
	alignOffset = 0,
	anchor,
	...props
}: AutocompletePrimitive.Popup.Props &
	Pick<
		AutocompletePrimitive.Positioner.Props,
		"side" | "align" | "sideOffset" | "alignOffset" | "anchor"
	>) {
	return (
		<AutocompletePrimitive.Portal>
			<AutocompletePrimitive.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				anchor={anchor}
				className="isolate z-50"
			>
				<AutocompletePrimitive.Popup
					data-slot="autocomplete-content"
					className={cn(
						"bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 max-h-72 min-w-36 overflow-hidden rounded-lg shadow-md ring-1 duration-100 group/autocomplete-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin)",
						className,
					)}
					{...props}
				/>
			</AutocompletePrimitive.Positioner>
		</AutocompletePrimitive.Portal>
	);
}

function AutocompleteList({
	className,
	...props
}: AutocompletePrimitive.List.Props) {
	return (
		<AutocompletePrimitive.List
			data-slot="autocomplete-list"
			className={cn(
				"no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto p-1 data-empty:p-0 overflow-y-auto overscroll-contain",
				className,
			)}
			{...props}
		/>
	);
}

function AutocompleteItem({
	className,
	children,
	...props
}: AutocompletePrimitive.Item.Props) {
	return (
		<AutocompletePrimitive.Item
			data-slot="autocomplete-item"
			className={cn(
				"data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-2 rounded-md py-1 pr-2 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
		</AutocompletePrimitive.Item>
	);
}

function AutocompleteGroup({
	className,
	...props
}: AutocompletePrimitive.Group.Props) {
	return (
		<AutocompletePrimitive.Group
			data-slot="autocomplete-group"
			className={cn(className)}
			{...props}
		/>
	);
}

function AutocompleteLabel({
	className,
	...props
}: AutocompletePrimitive.GroupLabel.Props) {
	return (
		<AutocompletePrimitive.GroupLabel
			data-slot="autocomplete-label"
			className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
			{...props}
		/>
	);
}

function AutocompleteCollection({
	...props
}: AutocompletePrimitive.Collection.Props) {
	return (
		<AutocompletePrimitive.Collection
			data-slot="autocomplete-collection"
			{...props}
		/>
	);
}

function AutocompleteEmpty({
	className,
	...props
}: AutocompletePrimitive.Empty.Props) {
	return (
		<AutocompletePrimitive.Empty
			data-slot="autocomplete-empty"
			className={cn(
				"text-muted-foreground hidden w-full justify-center py-2 text-center text-sm group-data-empty/autocomplete-content:flex",
				className,
			)}
			{...props}
		/>
	);
}

function AutocompleteSeparator({
	className,
	...props
}: AutocompletePrimitive.Separator.Props) {
	return (
		<AutocompletePrimitive.Separator
			data-slot="autocomplete-separator"
			className={cn("bg-border -mx-1 my-1 h-px", className)}
			{...props}
		/>
	);
}

function useAutocompleteAnchor() {
	return React.useRef<HTMLDivElement | null>(null);
}

export {
	Autocomplete,
	AutocompleteInput,
	AutocompleteContent,
	AutocompleteList,
	AutocompleteItem,
	AutocompleteGroup,
	AutocompleteLabel,
	AutocompleteCollection,
	AutocompleteEmpty,
	AutocompleteSeparator,
	AutocompleteTrigger,
	AutocompleteValue,
	useAutocompleteAnchor,
};
