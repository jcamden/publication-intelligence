"use client";

import { documentPageId } from "@pubint/core";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { logEvent } from "@/app/_common/_lib/logger";
import { trpc } from "@/app/_common/_trpc/client";
import { formatTrpcErrorMessage } from "@/app/_common/_trpc/error";
import { useDetectionRunStream } from "../../../../_hooks/use-detection-run-stream";
import {
	MatcherRunControlsEmptyState,
	MatcherRunControlsShared,
	savePersistedSelection,
	useMatcherRunState,
} from "../../../matcher-run-controls-shared";

export type PageMatcherRunControlsProps = {
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
	documentId: string;
	pageNumber: number;
	/** Shown when there are no groups; run button is disabled. */
	emptyStateMessage: string;
	/** Whether to show the "Matcher detection" heading. Default true. Set false when embedded in a modal. */
	showHeading?: boolean;
};

export const PageMatcherRunControls = ({
	projectId,
	projectIndexTypeId,
	indexType,
	documentId,
	pageNumber,
	emptyStateMessage: _emptyStateMessage,
	showHeading = true,
}: PageMatcherRunControlsProps) => {
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
		scope: "page",
		groups,
		groupsLoaded,
	});

	const { data: detectionRunsData } = trpc.detection.listDetectionRuns.useQuery(
		{ projectId: projectId || "" },
		{
			enabled: !!projectId,
		},
	);
	const detectionRuns = Array.isArray(detectionRunsData)
		? detectionRunsData
		: [];

	const currentPageId =
		documentId && pageNumber >= 1
			? documentPageId(documentId, pageNumber)
			: null;

	const activeMatcherRun = detectionRuns.find(
		(run) =>
			run.runType === "matcher" &&
			run.indexType === indexType &&
			run.scope === "page" &&
			run.pageId === currentPageId &&
			(run.status === "running" || run.status === "queued"),
	);

	const activeMatcherRunId = useMemo(
		() => activeMatcherRun?.id ?? null,
		[activeMatcherRun],
	);
	const stream = useDetectionRunStream({ runId: activeMatcherRunId });

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
	}, [
		stream.status,
		stream.pagesWithNewMentions,
		projectId,
		documentId,
		utils,
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
						scope: "page",
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

		if (!documentId || !pageNumber || pageNumber < 1) {
			setValidationError("Page is required for page-scoped detection.");
			logEvent({
				event: "detection.run_triggered",
				context: {
					metadata: {
						mode: "matcher",
						scope: "page",
						indexType,
						reason: "validation",
						message: "missing_page",
					},
				},
			});
			return;
		}

		if (!hasValidTargeting) {
			const msg = "Select at least one group or enable Run all groups.";
			setValidationError(msg);
			logEvent({
				event: "detection.run_triggered",
				context: {
					metadata: {
						mode: "matcher",
						scope: "page",
						indexType,
						reason: "validation",
					},
				},
			});
			return;
		}

		const pageId = documentPageId(documentId, pageNumber);

		savePersistedSelection(projectId, indexType, "page", {
			runAllGroups,
			selectedGroupIds: Array.from(selectedGroupIds),
		});

		logEvent({
			event: "detection.run_triggered",
			context: {
				metadata: {
					mode: "matcher",
					scope: "page",
					indexType,
					pageId,
					runAllGroups,
					selectedGroupCount: runAllGroups ? undefined : selectedGroupIds.size,
				},
			},
		});

		const payload = runAllGroups
			? {
					projectId,
					indexType,
					scope: "page" as const,
					pageId,
					runAllGroups: true,
				}
			: {
					projectId,
					indexType,
					scope: "page" as const,
					pageId,
					indexEntryGroupIds: Array.from(selectedGroupIds),
				};

		runMatcher.mutate(payload);
	}, [
		projectId,
		indexType,
		documentId,
		pageNumber,
		runAllGroups,
		selectedGroupIds,
		hasValidTargeting,
		runMatcher,
		setValidationError,
	]);

	const handleRunAllMatchers = useCallback(() => {
		setValidationError(null);

		if (!documentId || !pageNumber || pageNumber < 1) {
			setValidationError("Page is required for page-scoped detection.");
			return;
		}

		const pageId = documentPageId(documentId, pageNumber);

		logEvent({
			event: "detection.run_triggered",
			context: {
				metadata: {
					mode: "matcher",
					scope: "page",
					indexType,
					runAllMatchers: true,
				},
			},
		});

		runMatcher.mutate({
			projectId,
			indexType,
			scope: "page",
			pageId,
			runAllGroups: true,
		});
	}, [
		projectId,
		indexType,
		documentId,
		pageNumber,
		runMatcher,
		setValidationError,
	]);

	const isPending = runMatcher.isPending;

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
				<MatcherRunControlsEmptyState
					validationError={validationError}
					runButton={
						<button
							type="button"
							onClick={handleRunAllMatchers}
							disabled={isPending || !documentId || !pageNumber}
							className="mt-3 flex gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
							aria-busy={isPending}
							aria-disabled={isPending || !documentId || !pageNumber}
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
				runButton={
					<button
						type="button"
						onClick={handleRun}
						disabled={isPending || !documentId || !pageNumber}
						className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
						aria-busy={isPending}
						aria-disabled={isPending || !documentId || !pageNumber}
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
