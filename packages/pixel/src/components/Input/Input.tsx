import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ChangeEvent } from "react";

const inputVariants = cva(
	"w-full rounded-lg border-2 bg-surface text-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-text-secondary",
	{
		variants: {
			variant: {
				default: "border-border focus:border-primary focus:ring-primary",
				success: "border-success focus:border-success focus:ring-success",
				error: "border-error focus:border-error focus:ring-error",
				warning: "border-warning focus:border-warning focus:ring-warning",
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-base",
				lg: "px-5 py-3 text-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

export type InputProps = VariantProps<typeof inputVariants> & {
	id?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	type?: "text" | "email" | "password" | "number" | "tel" | "url";
	className?: string;
	onChange?: (value: string) => void;
	onBlur?: () => void;
	onFocus?: () => void;
};

export const Input = ({
	id,
	value,
	placeholder,
	disabled = false,
	required = false,
	type = "text",
	variant,
	size,
	className,
	onChange,
	onBlur,
	onFocus,
}: InputProps) => {
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChange?.(event.target.value);
	};

	return (
		<BaseInput
			id={id}
			className={clsx(inputVariants({ variant, size }), className)}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			required={required}
			type={type}
			onChange={handleChange}
			onBlur={onBlur}
			onFocus={onFocus}
		/>
	);
};
