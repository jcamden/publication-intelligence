import { Button } from "@pubint/yabasic/components/ui/button";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
	title: string;
	message: string;
	onRetry?: () => void;
};

export const ErrorState = ({ title, message, onRetry }: ErrorStateProps) => {
	return (
		<div className="flex flex-col items-center justify-center py-8 px-4 text-center">
			<AlertCircle size={64} className="text-destructive mb-4" />
			<h3 className="text-lg font-semibold mb-2">{title}</h3>
			<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-md">
				{message}
			</p>
			{onRetry && (
				<Button onClick={onRetry} variant="outline" size="sm">
					Try Again
				</Button>
			)}
		</div>
	);
};
