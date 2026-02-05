import type { ReactNode } from "react";

export type AlertVariant =
	| "default"
	| "destructive"
	| "error"
	| "success"
	| "info"
	| "warning";

export type AlertProps = {
	variant?: AlertVariant;
	children: ReactNode;
	className?: string;
};
