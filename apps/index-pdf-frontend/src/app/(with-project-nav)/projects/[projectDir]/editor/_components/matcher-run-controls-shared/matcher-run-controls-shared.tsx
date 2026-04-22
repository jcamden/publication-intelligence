"use client";

import type { ReactNode } from "react";

export type MatcherRunControlsSharedProps = {
	groups: Array<{ id: string; name: string; matcherCount?: number }>;
	runAllGroups: boolean;
	selectedGroupIds: Set<string>;
	toggleGroup: (groupId: string) => void;
	toggleRunAll: () => void;
	validationError: string | null;
	runButton: ReactNode;
	progressBar?: ReactNode;
	/** Optional content between group list and run button (e.g. page range inputs) */
	middleSection?: ReactNode;
};

export function MatcherRunControlsShared({
	groups,
	runAllGroups,
	selectedGroupIds,
	toggleGroup,
	toggleRunAll,
	validationError,
	runButton,
	progressBar,
	middleSection,
}: MatcherRunControlsSharedProps) {
	return (
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

			{middleSection}

			{validationError && (
				<p className="text-sm text-red-600 dark:text-red-400" role="alert">
					{validationError}
				</p>
			)}

			{runButton}
			{progressBar}
		</div>
	);
}

export type MatcherRunControlsEmptyStateProps = {
	validationError: string | null;
	runButton: ReactNode;
	progressBar?: ReactNode;
};

export function MatcherRunControlsEmptyState({
	validationError,
	runButton,
	progressBar,
}: MatcherRunControlsEmptyStateProps) {
	return (
		<div className="mt-3 space-y-3">
			<p className="text-sm text-neutral-500">
				Run detection using all matchers in this index. Add groups later to
				organize entries and control index layout.
			</p>
			{validationError && (
				<p className="text-sm text-red-600 dark:text-red-400" role="alert">
					{validationError}
				</p>
			)}
			{runButton}
			{progressBar}
		</div>
	);
}
