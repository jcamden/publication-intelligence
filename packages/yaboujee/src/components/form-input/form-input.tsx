"use client";

import {
	Field,
	FieldError,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";

export type FormInputProps = {
	field: {
		name: string;
		state: {
			value: string;
			meta: {
				errors: (string | undefined)[];
			};
		};
		handleChange: (value: string) => void;
		handleBlur: () => void;
	};
	label: string;
	placeholder?: string;
	type?: "text" | "email" | "password" | "number";
	inputRef?: React.RefObject<HTMLInputElement | null>;
	/** If true, hides the visual label but keeps it as aria-label for accessibility */
	hideLabel?: boolean;
};

/**
 * Standardized input wrapper for TanStack Form fields
 *
 * Integrates TanStack Form field state with yabasic Field components,
 * automatically handling errors, validation states, and accessibility.
 */
export const FormInput = ({
	field,
	label,
	placeholder,
	type = "text",
	inputRef,
	hideLabel = false,
}: FormInputProps) => {
	return (
		<Field data-invalid={field.state.meta.errors.length > 0}>
			{!hideLabel && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<Input
				ref={inputRef}
				id={field.name}
				type={type}
				placeholder={placeholder}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={field.state.meta.errors.length > 0}
				aria-label={hideLabel ? label : undefined}
			/>
			<FieldError
				errors={field.state.meta.errors
					.filter((err): err is string => err !== undefined)
					.map((err) => ({ message: err }))}
			/>
		</Field>
	);
};
