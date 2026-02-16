import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";

export type SmartSelectItem = {
	value: string;
	label: string;
};

export type SmartSelectProps = {
	value: string | null;
	onValueChange: (value: string | null) => void;
	items: SmartSelectItem[];
	placeholder?: string;
	id?: string;
	className?: string;
	size?: "sm" | "default" | "lg";
	disabled?: boolean;
	allowClear?: boolean;
};

/**
 * Enhanced Select that automatically displays the selected item's label
 * instead of its value.
 *
 * Usage:
 * ```tsx
 * <SmartSelect
 *   value={relationType}
 *   onValueChange={setRelationType}
 *   items={[
 *     { value: "see", label: "See" },
 *     { value: "see_also", label: "See also" },
 *     { value: "qv", label: "q.v." }
 *   ]}
 *   placeholder="Select type..."
 * />
 * ```
 */
export const SmartSelect = ({
	value,
	onValueChange,
	items,
	placeholder = "Select...",
	id,
	className,
	size,
	disabled,
	allowClear = false,
}: SmartSelectProps) => {
	const selectedItem = items.find((item) => item.value === value);

	return (
		<Select
			value={value ?? ""}
			onValueChange={(val) => {
				if (val === "" && allowClear) {
					onValueChange(null);
				} else {
					onValueChange(val);
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger id={id} className={className} size={size}>
				<SelectValue placeholder={placeholder}>
					{selectedItem ? selectedItem.label : placeholder}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{allowClear && value && <SelectItem value="">(Clear)</SelectItem>}
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
