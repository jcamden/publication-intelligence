"use client";

import { Book, Lightbulb, Loader2, Settings, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { logError, logEvent } from "@/app/_common/_lib/logger";
import { trpc } from "@/app/_common/_trpc/client";
import { useDetectionRunStream } from "../../../../_hooks/use-detection-run-stream";

type IndexType = "subject" | "author" | "scripture";

export type PageDetectionPanelProps = {
	projectId: string;
	documentId: string;
	pageNumber: number;
};

export const PageDetectionPanel = ({
	projectId,
	documentId,
	pageNumber,
}: PageDetectionPanelProps) => {
	const utils = trpc.useUtils();

	const {
		data: detectionRunsData,
		isLoading: isLoadingRuns,
		refetch: refetchRuns,
	} = trpc.detection.listDetectionRuns.useQuery(
		{ projectId: projectId || "" },
		{
			enabled: !!projectId,
		},
	);

	const { data: settings } = trpc.userSettings.get.useQuery(
		{},
		{ enabled: !!projectId },
	);

	const runDetection = trpc.detection.runLlm.useMutation({
		onSuccess: () => {
			refetchRuns();
		},
		onError: (error) => {
			logError({
				event: "detection.run_llm_failed",
				error,
				context: { metadata: { message: error.message } },
			});
		},
	});

	const cancelDetection = trpc.detection.cancelDetectionRun.useMutation({
		onSuccess: () => {
			refetchRuns();
		},
	});

	const handleRunDetection = (indexType: IndexType) => {
		if (!projectId || !documentId || !pageNumber || pageNumber < 1) return;

		const model = settings?.defaultDetectionModel || "openai/gpt-4o-mini";

		logEvent({
			event: "detection.run_triggered",
			context: {
				metadata: {
					scope: "page",
					pageNumber,
					indexType,
					mode: "llm",
				},
			},
		});

		runDetection.mutate({
			projectId,
			indexType,
			model,
			promptVersion: "v1",
			pageRangeStart: pageNumber,
			pageRangeEnd: pageNumber,
		});
	};

	const handleCancelDetection = (runId: string) => {
		cancelDetection.mutate({ runId });
	};

	const detectionRuns = Array.isArray(detectionRunsData)
		? detectionRunsData
		: [];

	const hasActiveRun = detectionRuns.some(
		(run) => run.status === "running" || run.status === "queued",
	);

	const activeLlmRunId = useMemo(() => {
		const active = detectionRuns.find(
			(r) =>
				r.runType === "llm" &&
				(r.status === "running" || r.status === "queued"),
		);
		return active?.id ?? null;
	}, [detectionRuns]);

	const stream = useDetectionRunStream({ runId: activeLlmRunId });

	useEffect(() => {
		if (!projectId) return;
		if (stream.status !== "completed") return;

		for (const pageToInvalidate of stream.pagesWithNewMentions) {
			utils.indexMention.listForPage.invalidate({
				projectId,
				documentId,
				pageNumber: pageToInvalidate,
			});
		}

		utils.indexEntry.listLean.invalidate({ projectId });
		utils.indexEntry.getIndexView.invalidate();
		void refetchRuns();
	}, [
		stream.status,
		stream.pagesWithNewMentions,
		projectId,
		documentId,
		utils,
		refetchRuns,
	]);

	const hasApiKey =
		!!settings?.openrouterApiKey ||
		!!process.env.NEXT_PUBLIC_HAS_GLOBAL_OPENROUTER_KEY;
	const displayModel = settings?.defaultDetectionModel || "openai/gpt-4o-mini";
	const canRun = !!documentId && !!pageNumber && pageNumber >= 1;

	const indexTypeConfig: Record<
		IndexType,
		{
			label: string;
			icon: React.ComponentType<{ className?: string }>;
			description: string;
		}
	> = {
		subject: {
			label: "Subject",
			icon: Lightbulb,
			description: "Concepts, topics, and ideas",
		},
		author: {
			label: "Author",
			icon: User,
			description: "People and scholars",
		},
		scripture: {
			label: "Scripture",
			icon: Book,
			description: "Biblical references",
		},
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-border bg-surface p-4">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">
							Concept Detection (this page)
						</h3>
						<Link
							href="/settings"
							className="rounded-md border border-border bg-background p-1.5 text-neutral-500 hover:text-foreground hover:bg-surface"
							title="Detection Settings"
						>
							<Settings className="h-4 w-4" />
						</Link>
					</div>

					<p className="text-sm text-neutral-500">
						Run detection on this page only. Choose an index type above.
					</p>

					{!hasApiKey && (
						<div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
							No OpenRouter API key configured.{" "}
							<Link
								href="/settings"
								className="font-medium underline hover:no-underline"
							>
								Add one in settings
							</Link>{" "}
							to enable detection.
						</div>
					)}

					{hasApiKey && (
						<div className="text-xs text-neutral-500">
							Using model: <span className="font-mono">{displayModel}</span>
						</div>
					)}

					<div className="space-y-2">
						<div className="text-xs font-medium text-neutral-500">
							Run Detection By Type
						</div>
						<div className="grid grid-cols-1 gap-2">
							{(["subject", "author", "scripture"] as IndexType[]).map(
								(type) => {
									const config = indexTypeConfig[type];
									const Icon = config.icon;
									return (
										<button
											key={type}
											type="button"
											onClick={() => handleRunDetection(type)}
											disabled={
												runDetection.isPending ||
												hasActiveRun ||
												!hasApiKey ||
												!canRun
											}
											className="flex items-center gap-3 rounded-2xl cursor-pointer border border-border bg-neutral-100 shadow dark:bg-neutral-900 px-3 py-2.5 text-left hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											<Icon className="h-5 w-5 text-primary flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium">
													{config.label}
												</div>
												<div className="text-xs text-neutral-500">
													{config.description}
												</div>
											</div>
											{runDetection.isPending && (
												<Loader2 className="h-4 w-4 animate-spin text-neutral-500 flex-shrink-0" />
											)}
										</button>
									);
								},
							)}
						</div>
					</div>
				</div>
			</div>

			{isLoadingRuns ? (
				<div className="flex items-center justify-center p-8">
					<Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
				</div>
			) : detectionRuns.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-4">
					<p className="text-sm text-neutral-500">
						No detection runs yet. Choose an index type above to start.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					<div className="text-xs font-medium text-neutral-500 px-1">
						Detection History
					</div>
					{detectionRuns.map((run) => {
						const config = indexTypeConfig[run.indexType as IndexType];
						const Icon = config?.icon || Lightbulb;

						return (
							<div
								key={run.id}
								className="rounded-lg border border-border bg-surface p-4"
							>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Icon className="h-4 w-4 text-primary" />
											<span className="text-sm font-medium">
												{config?.label || run.indexType}
											</span>
											{run.runType && (
												<span className="text-xs text-neutral-500 capitalize">
													({run.runType})
												</span>
											)}
											<span
												className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
													run.status === "completed"
														? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
														: run.status === "failed"
															? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
															: run.status === "cancelled"
																? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
																: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
												}`}
											>
												{run.status}
											</span>
											<span className="text-xs text-neutral-500">
												{new Date(run.createdAt).toLocaleString()}
											</span>
										</div>
										{run.status === "queued" && (
											<button
												type="button"
												onClick={() => handleCancelDetection(run.id)}
												className="text-muted hover:text-foreground"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>

									{run.status === "running" && (
										<div className="space-y-1">
											<div className="flex justify-between text-xs text-neutral-500">
												<span>
													Page {run.progressPage || 0}
													{run.pageRangeStart && run.pageRangeEnd
														? ` (range: ${run.pageRangeStart}-${run.pageRangeEnd})`
														: ` of ${run.totalPages}`}
												</span>
												{run.progressPage && run.totalPages
													? `${Math.round(
															(run.progressPage / run.totalPages) * 100,
														)}%`
													: null}
											</div>
											<div className="h-2 w-full rounded-full bg-border">
												<div
													className="h-2 rounded-full bg-primary transition-all"
													style={{
														width: `${
															run.progressPage && run.totalPages
																? (run.progressPage / run.totalPages) * 100
																: 0
														}%`,
													}}
												/>
											</div>
										</div>
									)}

									<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
										{run.runType === "llm" && run.model && (
											<span>Model: {run.model}</span>
										)}
										{(run.pageRangeStart || run.pageRangeEnd) && (
											<span>
												Pages: {run.pageRangeStart || 1} -{" "}
												{run.pageRangeEnd || run.totalPages}
											</span>
										)}
									</div>

									{(run.entriesCreated || run.mentionsCreated) && (
										<div className="text-xs text-neutral-500">
											Created {run.entriesCreated || 0} entries,{" "}
											{run.mentionsCreated || 0} mentions
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
