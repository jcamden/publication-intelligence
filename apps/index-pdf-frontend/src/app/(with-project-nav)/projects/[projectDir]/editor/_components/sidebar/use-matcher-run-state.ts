"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "detection-matcher";

export type PersistedSelection = {
	runAllGroups: boolean;
	selectedGroupIds: string[];
};

function getStorageKey(
	projectId: string,
	indexType: string,
	scope: "project" | "page",
): string {
	const suffix = scope === "page" ? "-page" : "";
	return `${STORAGE_KEY_PREFIX}${suffix}-${projectId}-${indexType}`;
}

export function loadPersistedSelection(
	projectId: string,
	indexType: string,
	scope: "project" | "page",
): PersistedSelection | null {
	if (typeof window === "undefined") return null;
	try {
		const key = getStorageKey(projectId, indexType, scope);
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

export function savePersistedSelection(
	projectId: string,
	indexType: string,
	scope: "project" | "page",
	value: PersistedSelection,
): void {
	try {
		const key = getStorageKey(projectId, indexType, scope);
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore
	}
}

export type UseMatcherRunStateOptions = {
	projectId: string;
	indexType: string;
	scope: "project" | "page";
	groups: Array<{ id: string; name: string; matcherCount?: number }>;
	groupsLoaded: boolean;
};

export function useMatcherRunState({
	projectId,
	indexType,
	scope,
	groups,
	groupsLoaded,
}: UseMatcherRunStateOptions) {
	const [runAllGroups, setRunAllGroups] = useState(false);
	const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [validationError, setValidationError] = useState<string | null>(null);

	// Hydrate from localStorage once groups are loaded; apply only if IDs still exist
	useEffect(() => {
		if (!groupsLoaded || groups.length === 0) return;
		const persisted = loadPersistedSelection(projectId, indexType, scope);
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
	}, [groupsLoaded, groups, projectId, indexType, scope]);

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
		setRunAllGroups((prev) => {
			if (!prev) setSelectedGroupIds(new Set());
			return !prev;
		});
		setValidationError(null);
	}, []);

	const hasSelection = !runAllGroups && selectedGroupIds.size > 0;
	const hasValidTargeting = runAllGroups || hasSelection;

	return {
		runAllGroups,
		setRunAllGroups,
		selectedGroupIds,
		setSelectedGroupIds,
		validationError,
		setValidationError,
		toggleGroup,
		toggleRunAll,
		hasValidTargeting,
	};
}
