"use client";

import { Book, Lightbulb, Loader2, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";
import { useProjectContext } from "@/app/projects/[projectDir]/editor/_context/project-context";
import { DetectionSettingsModal } from "./detection-settings-modal";

type IndexType = "subject" | "author" | "scripture";

export const DetectionPanel = () => {
	const { projectId } = useProjectContext();
	const [pageRangeStart, setPageRangeStart] = useState<string>("");
	const [pageRangeEnd, setPageRangeEnd] = useState<string>("");
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	// Fetch detection runs
	const {
		data: detectionRuns = [],
		isLoading: isLoadingRuns,
		refetch: refetchRuns,
	} = trpc.detection.listDetectionRuns.useQuery(
		{ projectId: projectId || "" },
		{
			enabled: !!projectId,
			// Only poll when there's an active detection run
			refetchInterval: (query) => {
				const runs = query.state.data || [];
				const hasActiveRun = runs.some(
					(run) => run.status === "running" || run.status === "queued",
				);
				return hasActiveRun ? 2000 : false;
			},
		},
	);

	// Fetch project settings
	const { data: settings } = trpc.projectSettings.get.useQuery(
		{ projectId: projectId || "" },
		{ enabled: !!projectId },
	);

	// Run detection mutation
	const runDetection = trpc.detection.runDetection.useMutation({
		onSuccess: () => {
			refetchRuns();
		},
		onError: (error) => {
			console.error("Failed to start detection:", error);
		},
	});

	// Cancel detection mutation
	const cancelDetection = trpc.detection.cancelDetectionRun.useMutation({
		onSuccess: () => {
			refetchRuns();
		},
	});

	const handleRunDetection = (indexType: IndexType) => {
		if (!projectId) return;

		const startPage = pageRangeStart
			? Number.parseInt(pageRangeStart, 10)
			: undefined;
		const endPage = pageRangeEnd
			? Number.parseInt(pageRangeEnd, 10)
			: undefined;

		// Validate page range
		if (startPage && endPage && startPage > endPage) {
			alert("Start page must be less than or equal to end page");
			return;
		}

		// Use default model from settings, or fall back to a default
		const model = settings?.defaultDetectionModel || "openai/gpt-4o-mini";

		runDetection.mutate({
			projectId,
			indexType,
			model,
			promptVersion: "v1",
			pageRangeStart: startPage,
			pageRangeEnd: endPage,
		});
	};

	const handleCancelDetection = (runId: string) => {
		cancelDetection.mutate({ runId });
	};

	const hasActiveRun = detectionRuns.some(
		(run) => run.status === "running" || run.status === "queued",
	);

	const hasApiKey =
		!!settings?.openrouterApiKey ||
		!!process.env.NEXT_PUBLIC_HAS_GLOBAL_OPENROUTER_KEY;
	const displayModel = settings?.defaultDetectionModel || "openai/gpt-4o-mini";

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
			<DetectionSettingsModal
				projectId={projectId || ""}
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>

			<div className="rounded-lg border border-border bg-surface p-4">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">Concept Detection</h3>
						<button
							type="button"
							onClick={() => setIsSettingsOpen(true)}
							className="rounded-md border border-border bg-background p-1.5 text-neutral-500 hover:text-foreground hover:bg-surface"
							title="Detection Settings"
						>
							<Settings className="h-4 w-4" />
						</button>
					</div>

					<p className="text-sm text-neutral-500">
						Automatically detect and index concepts, people, and references.
						Choose an index type to run detection.
					</p>

					{!hasApiKey && (
						<div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
							⚠️ No OpenRouter API key configured.{" "}
							<button
								type="button"
								onClick={() => setIsSettingsOpen(true)}
								className="font-medium underline hover:no-underline"
							>
								Add one in settings
							</button>{" "}
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
							Page Range (optional)
						</div>
						<div className="flex items-center gap-2">
							<input
								type="number"
								min="1"
								placeholder="Start"
								value={pageRangeStart}
								onChange={(e) => setPageRangeStart(e.target.value)}
								className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
							/>
							<span className="text-sm text-neutral-500">to</span>
							<input
								type="number"
								min="1"
								placeholder="End"
								value={pageRangeEnd}
								onChange={(e) => setPageRangeEnd(e.target.value)}
								className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
							/>
							<span className="text-xs text-neutral-500">
								(Leave blank for all pages)
							</span>
						</div>
					</div>

					{/* Separate buttons for each index type */}
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
												runDetection.isPending || hasActiveRun || !hasApiKey
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
											<span
												className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
													run.status === "completed"
														? "bg-green-100 text-green-800"
														: run.status === "failed"
															? "bg-red-100 text-red-800"
															: run.status === "cancelled"
																? "bg-gray-100 text-gray-800"
																: "bg-blue-100 text-blue-800"
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
												{run.pageRangeStart && run.pageRangeEnd ? (
													<span>
														{run.progressPage &&
														run.pageRangeStart &&
														run.pageRangeEnd
															? Math.round(
																	((run.progressPage - run.pageRangeStart + 1) /
																		(run.pageRangeEnd -
																			run.pageRangeStart +
																			1)) *
																		100,
																)
															: 0}
														%
													</span>
												) : (
													<span>
														{run.progressPage && run.totalPages
															? Math.round(
																	(run.progressPage / run.totalPages) * 100,
																)
															: 0}
														%
													</span>
												)}
											</div>
											<div className="h-2 w-full rounded-full bg-border">
												<div
													className="h-2 rounded-full bg-primary transition-all"
													style={{
														width: `${
															run.pageRangeStart &&
															run.pageRangeEnd &&
															run.progressPage
																? (
																		(run.progressPage -
																			run.pageRangeStart +
																			1) /
																			(run.pageRangeEnd -
																				run.pageRangeStart +
																				1)
																	) * 100
																: run.progressPage && run.totalPages
																	? (run.progressPage / run.totalPages) * 100
																	: 0
														}%`,
													}}
												/>
											</div>
										</div>
									)}

									<div className="flex gap-4 text-xs text-neutral-500">
										<span>Model: {run.model}</span>
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
