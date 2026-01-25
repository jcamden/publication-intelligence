import type { ReactNode } from "react";

export type CardProps = {
	children?: ReactNode;
	elevation?: "low" | "medium" | "high";
	className?: string;
};

const elevationClasses = {
	low: "shadow-sm",
	medium: "shadow-md",
	high: "shadow-lg",
};

export const Card = ({
	children,
	elevation = "low",
	className = "",
}: CardProps) => {
	const elevationClass = elevationClasses[elevation];
	const classes =
		`bg-white text-gray-900 rounded-lg p-6 ${elevationClass} ${className}`.trim();

	return <div className={classes}>{children}</div>;
};
