import { cn } from "@pubint/yabasic/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type BannerProps = {
	variant?: "info" | "success" | "warning" | "error";
	children: ReactNode;
	className?: string;
};

const variantStyles = {
	info: "bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
	success:
		"bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
	warning:
		"bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800",
	error:
		"bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800",
};

const icons = {
	info: Info,
	success: CheckCircle,
	warning: AlertTriangle,
	error: XCircle,
};

export const Banner = ({
	variant = "info",
	children,
	className,
}: BannerProps) => {
	const Icon = icons[variant];

	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4 py-3 border",
				variantStyles[variant],
				className,
			)}
			role="alert"
		>
			<Icon className="size-5 shrink-0" />
			<div className="flex-1 text-sm">{children}</div>
		</div>
	);
};
