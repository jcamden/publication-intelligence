"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { logEvent } from "@/app/_common/_lib/logger";
import { trpc } from "@/app/_common/_trpc/client";
import { formatTrpcErrorMessage } from "@/app/_common/_trpc/error";
import {
	MatcherRunControlsEmptyState,
	MatcherRunControlsShared,
	savePersistedSelection,
	useMatcherRunState,
} from "../../../matcher-run-controls-shared";

export type MatcherRunControlsProps = {
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
	/** Shown when there are no groups; run button is disabled. */
	emptyStateMessage: string;
	/** Whether to show the "Matcher detection" heading. Default true. Set false when embedded in a modal. */
	showHeading?: boolean;
};

export const MatcherRunControls = ({
	projectId,
	projectIndexTypeId,
	indexType,
	emptyStateMessage: _emptyStateMessage,
	showHeading = true,
}: MatcherRunControlsProps) => {
	const [pageRangeStart, setPageRangeStart] = useState<string>("");
	const [pageRangeEnd, setPageRangeEnd] = useState<string>("");

	const utils = trpc.useUtils();

	const { data: groups = [], isSuccess: groupsLoaded } =
		trpc.detection.listIndexEntryGroups.useQuery(
			{ projectId, projectIndexTypeId },
			{ enabled: !!projectId && !!projectIndexTypeId },
		);

	const {
		runAllGroups,
		selectedGroupIds,
		validationError,
		setValidationError,
		toggleGroup,
		toggleRunAll,
		hasValidTargeting,
	} = useMatcherRunState({
		projectId,
		indexType,
		scope: "project",
		groups,
		groupsLoaded,
	});

	const { data: detectionRunsData } = trpc.detection.listDetectionRuns.useQuery(
		{ projectId: projectId || "" },
		{
			enabled: !!projectId,
			refetchInterval: (query) => {
				const runs = Array.isArray(query.state.data) ? query.state.data : [];
				const hasActiveMatcherRun = runs.some(
					(run) =>
						run.runType === "matcher" &&
						run.indexType === indexType &&
						(run.status === "running" || run.status === "queued"),
				);
				return hasActiveMatcherRun ? 2000 : false;
			},
		},
	);
	const detectionRuns = Array.isArray(detectionRunsData)
		? detectionRunsData
		: [];

	const activeMatcherRun = detectionRuns.find(
		(run) =>
			run.runType === "matcher" &&
			run.indexType === indexType &&
			(run.status === "running" || run.status === "queued"),
	);

	// Invalidate mentions when a matcher run completes (so highlights update without refresh)
	const prevRunStatusesRef = useRef<Map<string, string>>(new Map());
	useEffect(() => {
		if (!projectId) return;
		let didComplete = false;
		for (const run of detectionRuns) {
			if (run.runType !== "matcher" || run.indexType !== indexType) continue;
			const prev = prevRunStatusesRef.current.get(run.id);
			const wasActive = prev === "running" || prev === "queued";
			const nowCompleted = run.status === "completed";
			if (wasActive && nowCompleted) {
				didComplete = true;
			}
			prevRunStatusesRef.current.set(run.id, run.status);
		}
		if (didComplete) {
			utils.indexEntry.listLean.invalidate({ projectId });
			utils.indexEntry.getIndexView.invalidate();
		}
	}, [
		detectionRuns,
		projectId,
		indexType,
		utils.indexEntry.listLean,
		utils.indexEntry.getIndexView,
	]);

	const runMatcher = trpc.detection.runMatcher.useMutation({
		onSuccess: () => {
			utils.detection.listDetectionRuns.invalidate({ projectId });
			setValidationError(null);
		},
		onError: (error) => {
			setValidationError(formatTrpcErrorMessage(error, "Run failed"));
			logEvent({
				event: "detection.run_triggered",
				context: {
					metadata: {
						mode: "matcher",
						scope: "project",
						indexType,
						reason: "api_failure",
						message: error.message,
					},
				},
			});
		},
	});

	const handleRun = useCallback(() => {
		setValidationError(null);

		if (!hasValidTargeting) {
			const msg = "Select at least one group or enable Run all groups.";
			setValidationError(msg);
			logEvent({
				event: "detection.run_triggered",
				context: {
					metadata: {
						mode: "matcher",
						scope: "project",
						indexType,
						reason: "validation",
					},
				},
			});
			return;
		}

		const startPage = pageRangeStart
			? Number.parseInt(pageRangeStart, 10)
			: undefined;
		const endPage = pageRangeEnd
			? Number.parseInt(pageRangeEnd, 10)
			: undefined;
		if (startPage != null && endPage != null && startPage > endPage) {
			setValidationError("Start page must be ≤ end page.");
			return;
		}

		const payload = runAllGroups
			? {
					projectId,
					indexType,
					scope: "project" as const,
					runAllGroups: true,
					...(startPage != null &&
						endPage != null && {
							pageRangeStart: startPage,
							pageRangeEnd: endPage,
						}),
				}
			: {
					projectId,
					indexType,
					scope: "project" as const,
					indexEntryGroupIds: Array.from(selectedGroupIds),
					...(startPage != null &&
						endPage != null && {
							pageRangeStart: startPage,
							pageRangeEnd: endPage,
						}),
				};

		savePersistedSelection(projectId, indexType, "project", {
			runAllGroups,
			selectedGroupIds: Array.from(selectedGroupIds),
		});

		logEvent({
			event: "detection.run_triggered",
			context: {
				metadata: {
					mode: "matcher",
					scope: "project",
					indexType,
					runAllGroups,
					selectedGroupCount: runAllGroups ? undefined : selectedGroupIds.size,
				},
			},
		});

		runMatcher.mutate(payload);
	}, [
		projectId,
		indexType,
		runAllGroups,
		selectedGroupIds,
		hasValidTargeting,
		pageRangeStart,
		pageRangeEnd,
		runMatcher,
		setValidationError,
	]);

	const isPending = runMatcher.isPending;

	const handleRunAllMatchers = useCallback(() => {
		setValidationError(null);
		logEvent({
			event: "detection.run_triggered",
			context: {
				metadata: {
					mode: "matcher",
					scope: "project",
					indexType,
					runAllMatchers: true,
				},
			},
		});
		const startPage = pageRangeStart
			? Number.parseInt(pageRangeStart, 10)
			: undefined;
		const endPage = pageRangeEnd
			? Number.parseInt(pageRangeEnd, 10)
			: undefined;
		if (startPage != null && endPage != null && startPage > endPage) {
			setValidationError("Start page must be ≤ end page.");
			return;
		}
		runMatcher.mutate({
			projectId,
			indexType,
			scope: "project",
			runAllGroups: true,
			...(startPage != null &&
				endPage != null && {
					pageRangeStart: startPage,
					pageRangeEnd: endPage,
				}),
		});
	}, [
		projectId,
		indexType,
		pageRangeStart,
		pageRangeEnd,
		runMatcher,
		setValidationError,
	]);

	const progressBar =
		activeMatcherRun &&
		activeMatcherRun.totalPages != null &&
		activeMatcherRun.totalPages > 0 ? (
			<div className="mt-3 space-y-1">
				<div className="flex justify-between text-xs text-neutral-500">
					<span>
						Page {activeMatcherRun.progressPage ?? 0} of{" "}
						{activeMatcherRun.totalPages}
					</span>
					<span>
						{Math.round(
							((activeMatcherRun.progressPage ?? 0) /
								activeMatcherRun.totalPages) *
								100,
						)}
						%
					</span>
				</div>
				<div className="h-2 w-full rounded-full bg-border">
					<div
						className="h-2 rounded-full bg-primary transition-all"
						style={{
							width: `${Math.min(
								100,
								((activeMatcherRun.progressPage ?? 0) /
									activeMatcherRun.totalPages) *
									100,
							)}%`,
						}}
					/>
				</div>
			</div>
		) : null;

	if (groups.length === 0 && groupsLoaded) {
		return (
			<div className="rounded-lg border border-border bg-surface p-4">
				{showHeading && (
					<h3 className="text-sm font-medium mb-2">Matcher detection</h3>
				)}
				<div className="mt-3 space-y-1">
					<span className="text-xs font-medium text-neutral-500">
						Page range (optional)
					</span>
					<div className="flex gap-2 items-center">
						<input
							id="matcher-page-start"
							type="number"
							min={1}
							placeholder="Start"
							value={pageRangeStart}
							onChange={(e) => setPageRangeStart(e.target.value)}
							className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
							aria-label="Start page"
						/>
						<span className="text-neutral-400">–</span>
						<input
							id="matcher-page-end"
							type="number"
							min={1}
							placeholder="End"
							value={pageRangeEnd}
							onChange={(e) => setPageRangeEnd(e.target.value)}
							className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
							aria-label="End page"
						/>
					</div>
					<p className="text-xs text-neutral-400">
						Leave blank to run on the full document.
					</p>
				</div>
				<MatcherRunControlsEmptyState
					validationError={validationError}
					runButton={
						<button
							type="button"
							onClick={handleRunAllMatchers}
							disabled={isPending}
							className="mt-3 flex gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
							aria-busy={isPending}
							aria-disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
							) : null}
							{isPending ? "Running…" : "Run matcher detection (all matchers)"}
						</button>
					}
					progressBar={progressBar}
				/>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-surface p-4">
			{showHeading && (
				<h3 className="text-sm font-medium mb-2">Matcher detection</h3>
			)}
			<MatcherRunControlsShared
				groups={groups}
				runAllGroups={runAllGroups}
				selectedGroupIds={selectedGroupIds}
				toggleGroup={toggleGroup}
				toggleRunAll={toggleRunAll}
				validationError={validationError}
				middleSection={
					<div className="space-y-1">
						<span className="text-xs font-medium text-neutral-500">
							Page range (optional)
						</span>
						<div className="flex gap-2 items-center">
							<input
								id="matcher-page-start-groups"
								type="number"
								min={1}
								placeholder="Start"
								value={pageRangeStart}
								onChange={(e) => setPageRangeStart(e.target.value)}
								className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
								aria-label="Start page"
							/>
							<span className="text-neutral-400">–</span>
							<input
								id="matcher-page-end-groups"
								type="number"
								min={1}
								placeholder="End"
								value={pageRangeEnd}
								onChange={(e) => setPageRangeEnd(e.target.value)}
								className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
								aria-label="End page"
							/>
						</div>
						<p className="text-xs text-neutral-400">
							Leave blank to run on the full document.
						</p>
					</div>
				}
				runButton={
					<button
						type="button"
						onClick={handleRun}
						disabled={isPending}
						className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-busy={isPending}
						aria-disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
						) : null}
						{isPending ? "Running…" : "Run matcher detection"}
					</button>
				}
				progressBar={progressBar}
			/>
		</div>
	);
};
