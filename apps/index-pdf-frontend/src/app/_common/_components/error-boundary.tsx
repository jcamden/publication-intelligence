"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { logError } from "../_lib/logger";

type Props = {
	children: ReactNode;
	fallback?: (error: Error, reset: () => void) => ReactNode;
	/** Identifies which boundary caught the error (e.g. `root`) for logs. */
	boundaryId?: string;
};

const toError = (value: unknown): Error =>
	value instanceof Error ? value : new Error(String(value));

const DefaultFallback = ({ error }: { error: Error }) => (
	<div className="flex min-h-screen items-center justify-center">
		<div className="max-w-md space-y-4 text-center">
			<h2 className="text-2xl font-bold">Something went wrong</h2>
			<p className="text-neutral-600 dark:text-neutral-400">{error.message}</p>
			<Button onClick={() => window.location.reload()}>Reload Page</Button>
		</div>
	</div>
);

export const ErrorBoundary = ({ children, fallback, boundaryId }: Props) => (
	<ReactErrorBoundary
		fallbackRender={(props) => {
			const error = toError(props.error);
			return fallback ? (
				fallback(error, props.resetErrorBoundary)
			) : (
				<DefaultFallback error={error} />
			);
		}}
		onError={(error, info) => {
			logError({
				event: "ui.error_boundary.caught",
				error: toError(error),
				context: {
					metadata: {
						componentStack: info.componentStack,
						...(boundaryId !== undefined ? { boundaryId } : {}),
					},
				},
			});
		}}
	>
		{children}
	</ReactErrorBoundary>
);
