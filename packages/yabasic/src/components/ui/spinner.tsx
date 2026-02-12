import { cn } from "@pubint/yabasic/lib/utils";
import { Loader2 } from "lucide-react";

type SpinnerProps = {
	className?: string;
	size?: "sm" | "md" | "lg";
};

const sizeClasses = {
	sm: "size-4",
	md: "size-6",
	lg: "size-8",
};

export const Spinner = ({ className, size = "md" }: SpinnerProps) => {
	return (
		<Loader2
			className={cn("animate-spin", sizeClasses[size], className)}
			aria-label="Loading"
		/>
	);
};
