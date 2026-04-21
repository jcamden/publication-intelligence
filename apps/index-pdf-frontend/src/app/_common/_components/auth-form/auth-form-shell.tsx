"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Alert, AlertDescription } from "@pubint/yaboujee";
import type { FormEventHandler, ReactNode } from "react";

export type AuthFormShellProps = {
	title: string;
	children: ReactNode;
	apiError: { message: string } | null | undefined;
	isLoading: boolean;
	submitLabel: string;
	loadingLabel?: string;
	footer: ReactNode;
	onFormSubmit: FormEventHandler<HTMLFormElement>;
};

export function AuthFormShell({
	title,
	children,
	apiError,
	isLoading,
	submitLabel,
	loadingLabel = "Loading...",
	footer,
	onFormSubmit,
}: AuthFormShellProps) {
	return (
		<div className="w-full max-w-md space-y-6">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">{title}</h1>
			</div>

			<form onSubmit={onFormSubmit} className="space-y-4">
				{children}

				{apiError && (
					<Alert variant="error">
						<AlertDescription>{apiError.message}</AlertDescription>
					</Alert>
				)}

				<Button type="submit" disabled={isLoading} className="w-full">
					{isLoading ? loadingLabel : submitLabel}
				</Button>
			</form>

			{footer}
		</div>
	);
}
