import {
	getBootstrapApocryphaMatchers,
	getBootstrapChristianWritingsMatchers,
	getBootstrapClassicalWritingsMatchers,
	getBootstrapDeadSeaScrollsMatchers,
	getBootstrapJewishWritingsMatchers,
	getCanonBookKeys,
	getCanonGroupDisplayName,
	slugifyBootstrapKey,
} from "@pubint/core";
import type { CanonId } from "../scripture-index-config/scripture-index-config.types";
import {
	BOOTSTRAP_GROUP_NAMES,
	findEntriesWithGroupBySlugs,
} from "./scripture-bootstrap.repo";

export type AddEntriesConfig = {
	selectedCanon: CanonId | null;
	includeApocrypha: boolean;
	includeJewishWritings: boolean;
	includeClassicalWritings: boolean;
	includeChristianWritings: boolean;
	includeDeadSeaScrolls: boolean;
	extraBookKeys: string[];
};

export type BootstrapConflictPreview = {
	hasConflicts: boolean;
	conflictingEntries: Array<{
		slug: string;
		label: string;
		currentGroupName: string;
		newGroupName: string;
	}>;
};

function getPlannedEntriesForConfig(
	config: AddEntriesConfig,
): Array<{ newGroupName: string; slug: string }> {
	const planned: Array<{ newGroupName: string; slug: string }> = [];
	if (!config.selectedCanon) return planned;

	const canonId = config.selectedCanon as CanonId;

	const canonBookKeys = getCanonBookKeys(canonId);
	const canonGroupName = getCanonGroupDisplayName(canonId);
	for (const bookKey of canonBookKeys) {
		planned.push({ newGroupName: canonGroupName, slug: bookKey });
	}

	if (config.includeApocrypha) {
		const apocMatchers = getBootstrapApocryphaMatchers();
		for (const key of Object.keys(apocMatchers)) {
			planned.push({
				newGroupName: BOOTSTRAP_GROUP_NAMES[1],
				slug: slugifyBootstrapKey(key),
			});
		}
	}

	if (config.includeJewishWritings) {
		const matchers = getBootstrapJewishWritingsMatchers();
		for (const key of Object.keys(matchers)) {
			planned.push({
				newGroupName: BOOTSTRAP_GROUP_NAMES[2],
				slug: slugifyBootstrapKey(key),
			});
		}
	}

	if (config.includeClassicalWritings) {
		const matchers = getBootstrapClassicalWritingsMatchers();
		for (const key of Object.keys(matchers)) {
			planned.push({
				newGroupName: BOOTSTRAP_GROUP_NAMES[3],
				slug: slugifyBootstrapKey(key),
			});
		}
	}

	if (config.includeChristianWritings) {
		const matchers = getBootstrapChristianWritingsMatchers();
		for (const key of Object.keys(matchers)) {
			planned.push({
				newGroupName: BOOTSTRAP_GROUP_NAMES[4],
				slug: slugifyBootstrapKey(key),
			});
		}
	}

	if (config.includeDeadSeaScrolls) {
		const matchers = getBootstrapDeadSeaScrollsMatchers();
		for (const key of Object.keys(matchers)) {
			planned.push({
				newGroupName: BOOTSTRAP_GROUP_NAMES[5],
				slug: slugifyBootstrapKey(key),
			});
		}
	}

	for (const bookKey of config.extraBookKeys ?? []) {
		planned.push({
			newGroupName: BOOTSTRAP_GROUP_NAMES[6],
			slug: slugifyBootstrapKey(bookKey),
		});
	}

	return planned;
}

/**
 * Preview conflicts: entries that would be added to a new group but already exist in another group.
 */
export async function previewConflicts({
	projectId,
	projectIndexTypeId,
	config,
	userId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	config: AddEntriesConfig;
	userId: string;
}): Promise<BootstrapConflictPreview> {
	const planned = getPlannedEntriesForConfig(config);
	if (planned.length === 0) {
		return { hasConflicts: false, conflictingEntries: [] };
	}

	const slugs = [...new Set(planned.map((p) => p.slug))];
	const slugToNewGroup = new Map(planned.map((p) => [p.slug, p.newGroupName]));

	const entriesWithGroups = await findEntriesWithGroupBySlugs({
		userId,
		projectId,
		projectIndexTypeId,
		slugs,
	});

	const conflictingEntries: BootstrapConflictPreview["conflictingEntries"] = [];
	for (const e of entriesWithGroups) {
		if (e.groupName == null) continue;
		const newGroupName = slugToNewGroup.get(e.slug);
		if (newGroupName == null) continue;
		if (e.groupName !== newGroupName) {
			conflictingEntries.push({
				slug: e.slug,
				label: e.label,
				currentGroupName: e.groupName,
				newGroupName,
			});
		}
	}

	return {
		hasConflicts: conflictingEntries.length > 0,
		conflictingEntries,
	};
}

export function configSnapshotHash(config: AddEntriesConfig): string {
	const str = JSON.stringify({
		selectedCanon: config.selectedCanon,
		includeApocrypha: config.includeApocrypha,
		includeJewishWritings: config.includeJewishWritings,
		includeClassicalWritings: config.includeClassicalWritings,
		includeChristianWritings: config.includeChristianWritings,
		includeDeadSeaScrolls: config.includeDeadSeaScrolls,
		extraBookKeys: config.extraBookKeys,
	});
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		h = (h << 5) - h + c;
		h = h & h;
	}
	return `c${h >>> 0}`;
}
