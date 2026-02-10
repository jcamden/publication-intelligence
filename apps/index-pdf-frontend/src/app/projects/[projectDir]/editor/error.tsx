"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { useEffect } from "react";

export default function EditorError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Editor error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="max-w-md space-y-4 text-center">
				<h2 className="text-2xl font-bold">Failed to load editor</h2>
				<p className="text-neutral-600 dark:text-neutral-400">
					{error.message || "An unexpected error occurred"}
				</p>
				<div className="flex gap-2 justify-center">
					<Button onClick={reset}>Try Again</Button>
					<Button variant="ghost" onClick={() => window.history.back()}>
						Go Back
					</Button>
				</div>
			</div>
		</div>
	);
}
