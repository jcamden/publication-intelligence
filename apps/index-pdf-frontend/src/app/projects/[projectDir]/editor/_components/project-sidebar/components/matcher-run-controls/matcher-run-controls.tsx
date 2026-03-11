"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { logEvent } from "@/app/_common/_lib/logger";
import { trpc } from "@/app/_common/_utils/trpc";

const STORAGE_KEY_PREFIX = "detection-matcher";

type PersistedSelection = {
	runAllGroups: boolean;
	selectedGroupIds: string[];
};

function loadPersistedSelection(
	projectId: string,
	indexType: string,
): PersistedSelection | null {
	if (typeof window === "undefined") return null;
	try {
		const key = `${STORAGE_KEY_PREFIX}-${projectId}-${indexType}`;
		const raw = window.localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		if (
			parsed &&
			typeof parsed === "object" &&
			"runAllGroups" in parsed &&
			"selectedGroupIds" in parsed &&
			typeof (parsed as PersistedSelection).runAllGroups === "boolean" &&
			Array.isArray((parsed as PersistedSelection).selectedGroupIds)
		) {
			return {
				runAllGroups: (parsed as PersistedSelection).runAllGroups,
				selectedGroupIds: (parsed as PersistedSelection).selectedGroupIds
					.filter((id): id is string => typeof id === "string")
					.slice(0, 500),
			};
		}
	} catch {
		// ignore
	}
	return null;
}

function savePersistedSelection(
	projectId: string,
	indexType: string,
	value: PersistedSelection,
): void {
	try {
		const key = `${STORAGE_KEY_PREFIX}-${projectId}-${indexType}`;
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore
	}
}

export type MatcherRunControlsProps = {
	projectId: string;
	projectIndexTypeId: string;
	indexType: string;
	/** Shown when there are no groups; run button is disabled. */
	emptyStateMessage: string;
};

export const MatcherRunControls = ({
	projectId,
	projectIndexTypeId,
	indexType,
	emptyStateMessage: _emptyStateMessage,
}: MatcherRunControlsProps) => {
	const [runAllGroups, setRunAllGroups] = useState(false);
	const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [pageRangeStart, setPageRangeStart] = useState<string>("");
	const [pageRangeEnd, setPageRangeEnd] = useState<string>("");

	const utils = trpc.useUtils();

	const { data: groups = [], isSuccess: groupsLoaded } =
		trpc.detection.listIndexEntryGroups.useQuery(
			{ projectId, projectIndexTypeId },
			{ enabled: !!projectId && !!projectIndexTypeId },
		);

	const { data: detectionRuns = [] } = trpc.detection.listDetectionRuns.useQuery(
		{ projectId: projectId || "" },
		{
			enabled: !!projectId,
			refetchInterval: (query) => {
				const runs = query.state.data || [];
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

	const activeMatcherRun = detectionRuns.find(
		(run) =>
			run.runType === "matcher" &&
			run.indexType === indexType &&
			(run.status === "running" || run.status === "queued"),
	);

	// Hydrate from localStorage once groups are loaded; apply only if IDs still exist
	useEffect(() => {
		if (!groupsLoaded || groups.length === 0) return;
		const persisted = loadPersistedSelection(projectId, indexType);
		if (!persisted) return;
		const validIds = new Set(groups.map((g) => g.id));
		if (persisted.runAllGroups) {
			setRunAllGroups(true);
			setSelectedGroupIds(new Set());
		} else {
			const kept = persisted.selectedGroupIds.filter((id) => validIds.has(id));
			if (kept.length > 0) {
				setRunAllGroups(false);
				setSelectedGroupIds(new Set(kept));
			}
		}
	}, [groupsLoaded, groups, projectId, indexType]);

	const runMatcher = trpc.detection.runMatcher.useMutation({
		onSuccess: () => {
			utils.detection.listDetectionRuns.invalidate({ projectId });
			setValidationError(null);
		},
		onError: (error) => {
			setValidationError(error.message || "Run failed");
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

		const hasSelection = !runAllGroups && selectedGroupIds.size > 0;
		const valid = runAllGroups || hasSelection;

		if (!valid) {
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

		savePersistedSelection(projectId, indexType, {
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
		pageRangeStart,
		pageRangeEnd,
		runMatcher,
	]);

	const toggleGroup = useCallback((groupId: string) => {
		setSelectedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
		});
		setRunAllGroups(false);
		setValidationError(null);
	}, []);

	const toggleRunAll = useCallback(() => {
		setRunAllGroups((prev) => !prev);
		if (!runAllGroups) setSelectedGroupIds(new Set());
		setValidationError(null);
	}, [runAllGroups]);

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
	}, [projectId, indexType, pageRangeStart, pageRangeEnd, runMatcher]);

	if (groups.length === 0 && groupsLoaded) {
		return (
			<div className="rounded-lg border border-border bg-surface p-4">
				<h3 className="text-sm font-medium mb-2">Matcher detection</h3>
				<p className="text-sm text-neutral-500">
					Run detection using all matchers in this index. Add groups later to
					organize entries and control index layout.
				</p>
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
				{validationError && (
					<p
						className="text-sm text-red-600 dark:text-red-400 mt-2"
						role="alert"
					>
						{validationError}
					</p>
				)}
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
				{activeMatcherRun &&
					activeMatcherRun.totalPages != null &&
					activeMatcherRun.totalPages > 0 && (
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
					)}
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-surface p-4">
			<h3 className="text-sm font-medium mb-2">Matcher detection</h3>

			<div className="space-y-3">
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={runAllGroups}
						onChange={toggleRunAll}
						className="rounded border-border"
						aria-describedby="run-all-desc"
					/>
					<span className="text-sm">Run all groups</span>
				</label>
				<p id="run-all-desc" className="text-xs text-neutral-500 -mt-2">
					When enabled, all groups for this index type are included; group
					selection below is ignored.
				</p>

				<fieldset
					className="space-y-1 border-0 p-0 m-0"
					aria-label="Index entry groups"
				>
					<legend className="text-xs font-medium text-neutral-500">
						Select groups (optional when Run all is enabled)
					</legend>
					<div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-2 space-y-1">
						{groups.map((g) => (
							<label
								key={g.id}
								className="flex items-center gap-2 cursor-pointer text-sm"
							>
								<input
									type="checkbox"
									checked={runAllGroups ? false : selectedGroupIds.has(g.id)}
									onChange={() => toggleGroup(g.id)}
									disabled={runAllGroups}
									className="rounded border-border"
									aria-label={`Group: ${g.name}`}
								/>
								<span className="truncate">{g.name}</span>
								{g.matcherCount !== undefined && (
									<span className="text-xs text-neutral-400">
										({g.matcherCount} matcher{g.matcherCount !== 1 ? "s" : ""})
									</span>
								)}
							</label>
						))}
					</div>
				</fieldset>

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

				{validationError && (
					<p className="text-sm text-red-600 dark:text-red-400" role="alert">
						{validationError}
					</p>
				)}

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
				{activeMatcherRun &&
					activeMatcherRun.totalPages != null &&
					activeMatcherRun.totalPages > 0 && (
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
					)}
			</div>
		</div>
	);
};
