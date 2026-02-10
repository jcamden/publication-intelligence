"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
	children: ReactNode;
	fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
	hasError: boolean;
	error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
	state: State = {
		hasError: false,
		error: null,
	};

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Error boundary caught:", error, errorInfo);
	}

	reset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.reset);
			}

			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="max-w-md space-y-4 text-center">
						<h2 className="text-2xl font-bold">Something went wrong</h2>
						<p className="text-neutral-600 dark:text-neutral-400">
							{this.state.error.message}
						</p>
						<Button onClick={() => window.location.reload()}>
							Reload Page
						</Button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
