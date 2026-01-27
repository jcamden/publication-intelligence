import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import type { ReactNode } from "react";

const buttonVariants = cva(
	"font-medium rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				primary:
					"bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:bg-neutral-300 disabled:text-neutral-500",
				secondary:
					"bg-secondary text-white hover:bg-secondary-dark active:bg-secondary-dark disabled:bg-neutral-300 disabled:text-neutral-500",
				outline:
					"border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20 disabled:border-neutral-300 disabled:text-neutral-400",
				ghost:
					"text-primary hover:bg-surface-hover active:bg-surface-hover disabled:text-neutral-400",
				danger:
					"bg-error text-white hover:bg-error-dark active:bg-error-dark disabled:bg-neutral-300 disabled:text-neutral-500",
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-base",
				lg: "px-6 py-3 text-lg",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

export type ButtonProps = VariantProps<typeof buttonVariants> & {
	children?: ReactNode;
	disabled?: boolean;
	className?: string;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
};

export const Button = ({
	children,
	variant,
	size,
	disabled = false,
	className,
	onClick,
	type = "button",
}: ButtonProps) => {
	return (
		<BaseButton
			className={clsx(buttonVariants({ variant, size }), className)}
			disabled={disabled}
			onClick={onClick}
			type={type}
		>
			{children}
		</BaseButton>
	);
};
