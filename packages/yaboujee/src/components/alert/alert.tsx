import type { ReactNode } from "react";

export type AlertVariant = "error" | "success" | "info" | "warning";

export type AlertProps = {
	variant?: AlertVariant;
	children: ReactNode;
	className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
	error: "bg-destructive/10 border-destructive text-destructive",
	success:
		"bg-green-500/10 border-green-500 text-green-700 dark:text-green-400",
	info: "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400",
	warning:
		"bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400",
};

export const Alert = ({
	variant = "info",
	children,
	className = "",
}: AlertProps) => {
	const styles = variantStyles[variant];

	return (
		<div className={`p-3 border rounded-lg ${styles} ${className}`}>
			<p className="text-sm">{children}</p>
		</div>
	);
};
