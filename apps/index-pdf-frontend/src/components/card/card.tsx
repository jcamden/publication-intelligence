import type { CSSProperties, ReactNode } from "react";

export type CardProps = {
	children?: ReactNode;
	elevation?: "low" | "medium" | "high";
	className?: string;
	style?: CSSProperties;
};

export const Card = ({
	children,
	elevation,
	className = "",
	style,
	...props
}: CardProps) => {
	const elevationStyles: Record<string, CSSProperties> = {
		low: { boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)" },
		medium: {
			boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
		},
		high: {
			boxShadow: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
		},
	};

	const baseStyles: CSSProperties = {
		backgroundColor: "white",
		borderRadius: "8px",
		padding: "24px",
		...style,
		...(elevation ? elevationStyles[elevation] : {}),
	};

	return (
		<div className={className} style={baseStyles} {...props}>
			{children}
		</div>
	);
};
