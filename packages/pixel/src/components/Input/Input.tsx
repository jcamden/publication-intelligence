import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

const inputVariants = cva(
	"w-full rounded-lg border-2 text-text transition-colors duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-text-secondary",
	{
		variants: {
			variant: {
				default: "border-border bg-surface focus:border-primary",
				success: "border-border bg-success/10 focus:border-success",
				error: "border-border bg-error/10 focus:border-error",
				warning: "border-border bg-warning/10 focus:border-warning",
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

export type InputProps = VariantProps<typeof inputVariants> &
	Omit<ComponentPropsWithoutRef<"input">, "size">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ variant, size, className, type = "text", ...props }, ref) => {
		return (
			<BaseInput
				ref={ref}
				className={clsx(inputVariants({ variant, size }), className)}
				type={type}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";
