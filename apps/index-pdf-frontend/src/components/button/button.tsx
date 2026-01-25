import { Button as BaseButton } from "@base-ui/react/button";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
	children?: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	className?: string;
	onClick?: () => void;
};

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300",
	secondary:
		"bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 disabled:bg-gray-300",
	outline:
		"border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 disabled:border-gray-300 disabled:text-gray-300",
	ghost:
		"text-blue-600 hover:bg-blue-50 active:bg-blue-100 disabled:text-gray-300",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-base",
	lg: "px-6 py-3 text-lg",
};

export const Button = ({
	children,
	variant = "primary",
	size = "md",
	disabled = false,
	className = "",
	onClick,
}: ButtonProps) => {
	const baseClasses =
		"font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed";
	const variantClass = variantClasses[variant];
	const sizeClass = sizeClasses[size];
	const classes =
		`${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

	return (
		<BaseButton className={classes} disabled={disabled} onClick={onClick}>
			{children}
		</BaseButton>
	);
};
