"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
	emptyStateMessage,
}: MatcherRunControlsProps) => {
	const [runAllGroups, setRunAllGroups] = useState(false);
	const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [validationError, setValidationError] = useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data: groups = [], isSuccess: groupsLoaded } =
		trpc.detection.listIndexEntryGroups.useQuery(
			{ projectId, projectIndexTypeId },
			{ enabled: !!projectId && !!projectIndexTypeId },
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

		const payload = runAllGroups
			? { projectId, indexType, scope: "project" as const, runAllGroups: true }
			: {
					projectId,
					indexType,
					scope: "project" as const,
					indexEntryGroupIds: Array.from(selectedGroupIds),
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
	}, [projectId, indexType, runAllGroups, selectedGroupIds, runMatcher]);

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

	const canSubmit = useMemo(() => {
		if (groups.length === 0) return false;
		return runAllGroups || selectedGroupIds.size > 0;
	}, [groups.length, runAllGroups, selectedGroupIds.size]);

	const isPending = runMatcher.isPending;

	if (groups.length === 0 && groupsLoaded) {
		return (
			<div className="rounded-lg border border-border bg-surface p-4">
				<h3 className="text-sm font-medium mb-2">Matcher detection</h3>
				<output className="block text-sm text-neutral-500">
					{emptyStateMessage}
				</output>
				<p className="text-xs text-neutral-400 mt-1">
					No groups for this index type. Run is disabled until you add groups
					and matchers.
				</p>
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
			</div>
		</div>
	);
};
