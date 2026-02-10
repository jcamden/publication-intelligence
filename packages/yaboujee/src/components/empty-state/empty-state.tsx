import type { ReactNode } from "react";

export type EmptyStateProps = {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
};

export const EmptyState = ({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) => {
	return (
		<div className="flex flex-col items-center justify-center py-8 px-4 text-center">
			{icon && (
				<div className="mb-4 text-neutral-400 dark:text-neutral-600">
					{icon}
				</div>
			)}
			<h3 className="text-lg font-medium mb-2">{title}</h3>
			{description && (
				<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-md">
					{description}
				</p>
			)}
			{action && <div>{action}</div>}
		</div>
	);
};
