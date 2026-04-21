import {
	getBookLabel,
	getBootstrapApocryphaMatchers,
	getBootstrapCanonMatchers,
	getBootstrapChristianWritingsMatchers,
	getBootstrapClassicalWritingsMatchers,
	getBootstrapDeadSeaScrollsMatchers,
	getBootstrapJewishWritingsMatchers,
	getCanonBookKeys,
	getCanonGroupDisplayName,
	getMatchersForExtraBookKey,
	normalize,
	slugifyBootstrapKey,
} from "@pubint/core";
import { TRPCError } from "@trpc/server";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import type { CanonId } from "../scripture-index-config/scripture-index-config.types";
import {
	type AddEntriesConfig,
	type BootstrapConflictPreview,
	configSnapshotHash,
	previewConflicts,
} from "./scripture-bootstrap.preview";
import type { BootstrapCounts } from "./scripture-bootstrap.repo";
import {
	BOOTSTRAP_GROUP_NAMES,
	ensureEntryInGroup,
	ensureMatcherInGroup,
	findOrCreateEntry,
	findOrCreateGroup,
	findOrCreateMatcher,
	insertBootstrapRunStart,
	updateBootstrapRunCounts,
} from "./scripture-bootstrap.repo";

export type { AddEntriesConfig, BootstrapConflictPreview };
export { previewConflicts };

/**
 * Run scripture bootstrap: seed entries/matchers/groups from config.
 * Config is passed from the frontend form; not persisted.
 * Fails fast when selected_canon is missing. Idempotent for same config.
 * Re-bootstrap reuses rows by stable keys and preserves user edits unless forceRefreshFromSource is true.
 */
export async function run({
	projectId,
	projectIndexTypeId,
	config,
	userId,
	requestId,
	forceRefreshFromSource = false,
	conflictResolution = "transfer",
}: {
	projectId: string;
	projectIndexTypeId: string;
	config: AddEntriesConfig;
	userId: string;
	requestId: string;
	/** When true, overwrite labels/group names from source; default false preserves user edits */
	forceRefreshFromSource?: boolean;
	/** When entries exist in another group: "leave" = skip adding; "transfer" = move them */
	conflictResolution?: "leave" | "transfer";
}): Promise<BootstrapCounts> {
	if (!config.selectedCanon) {
		logEvent({
			event: "scripture_bootstrap.rejected_no_canon",
			context: {
				requestId,
				userId,
				metadata: { projectId, projectIndexTypeId },
			},
		});
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Bootstrap requires a selected canon. Set selected canon in scripture index config and try again.",
		});
	}

	const hash = configSnapshotHash(config);
	const { id: runId } = await insertBootstrapRunStart({
		userId,
		projectId,
		projectIndexTypeId,
		configSnapshotHash: hash,
	});

	const canonId = config.selectedCanon as CanonId;

	// When "leave", skip adding entries that are already in another group
	const slugsToSkip =
		conflictResolution === "leave"
			? new Set(
					(
						await previewConflicts({
							projectId,
							projectIndexTypeId,
							config,
							userId,
						})
					).conflictingEntries.map((e) => e.slug),
				)
			: null;
	const counts: BootstrapCounts = {
		entriesCreated: 0,
		entriesReused: 0,
		matchersCreated: 0,
		matchersReused: 0,
		groupsCreated: 0,
		membershipsCreated: 0,
	};

	// 1) Canon books
	const canonBookKeys = getCanonBookKeys(canonId);
	const canonMatchers = getBootstrapCanonMatchers(canonId);
	const canonGroupName = getCanonGroupDisplayName(canonId);
	const { groupId: canonGroupId, created: canonGroupCreated } =
		await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: canonGroupName,
			sortMode: canonId,
			seedRunId: runId,
			forceRefreshFromSource,
		});
	if (canonGroupCreated) counts.groupsCreated++;
	let entryPosition = 0;
	for (let i = 0; i < canonBookKeys.length; i++) {
		const bookKey = canonBookKeys[i];
		const slug = bookKey;
		const label = getBookLabel(bookKey, canonId);
		const aliases = canonMatchers[bookKey] ?? [];
		const { entryId, created: entryCreated } = await findOrCreateEntry({
			userId,
			projectId,
			projectIndexTypeId,
			slug,
			label,
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (entryCreated) counts.entriesCreated++;
		else counts.entriesReused++;
		if (slugsToSkip?.has(slug)) {
			entryPosition++;
		} else {
			const added = await ensureEntryInGroup({
				userId,
				groupId: canonGroupId,
				entryId,
				position: entryPosition++,
			});
			if (added) counts.membershipsCreated++;
		}
		let matcherPosition = 0;
		for (const raw of aliases) {
			if (!normalize(raw)) continue;
			const { matcherId, created: matcherCreated } = await findOrCreateMatcher({
				userId,
				entryId,
				projectIndexTypeId,
				text: raw,
				seedRunId: runId,
			});
			if (matcherCreated) counts.matchersCreated++;
			else counts.matchersReused++;
			const matcherAdded = await ensureMatcherInGroup({
				userId,
				groupId: canonGroupId,
				matcherId,
				position: matcherPosition++,
			});
			if (matcherAdded) counts.membershipsCreated++;
		}
	}

	// 2) Apocrypha
	if (config.includeApocrypha) {
		const apocMatchers = getBootstrapApocryphaMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[1],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		entryPosition = 0;
		for (const [key, aliases] of Object.entries(apocMatchers)) {
			const slug = slugifyBootstrapKey(key);
			const traditionLabel = getBookLabel(key, canonId);
			const label =
				traditionLabel !== key ? traditionLabel : (aliases[0] ?? key);
			const { entryId, created: entryCreated } = await findOrCreateEntry({
				userId,
				projectId,
				projectIndexTypeId,
				slug,
				label,
				seedRunId: runId,
				forceRefreshFromSource,
			});
			if (entryCreated) counts.entriesCreated++;
			else counts.entriesReused++;
			if (slugsToSkip?.has(slug)) {
				entryPosition++;
			} else {
				const added = await ensureEntryInGroup({
					userId,
					groupId,
					entryId,
					position: entryPosition++,
				});
				if (added) counts.membershipsCreated++;
			}
			let matcherPosition = 0;
			for (const raw of aliases) {
				if (!normalize(raw)) continue;
				const { matcherId, created: matcherCreated } =
					await findOrCreateMatcher({
						userId,
						entryId,
						projectIndexTypeId,
						text: raw,
						seedRunId: runId,
					});
				if (matcherCreated) counts.matchersCreated++;
				else counts.matchersReused++;
				const matcherAdded = await ensureMatcherInGroup({
					userId,
					groupId,
					matcherId,
					position: matcherPosition++,
				});
				if (matcherAdded) counts.membershipsCreated++;
			}
		}
	}

	// 3) Jewish Writings
	if (config.includeJewishWritings) {
		const matchers = getBootstrapJewishWritingsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[2],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		await seedCorpus(
			userId,
			projectId,
			projectIndexTypeId,
			groupId,
			matchers,
			counts,
			runId,
			forceRefreshFromSource,
			slugsToSkip,
		);
	}

	// 4) Classical Writings
	if (config.includeClassicalWritings) {
		const matchers = getBootstrapClassicalWritingsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[3],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		await seedCorpus(
			userId,
			projectId,
			projectIndexTypeId,
			groupId,
			matchers,
			counts,
			runId,
			forceRefreshFromSource,
			slugsToSkip,
		);
	}

	// 5) Christian Writings
	if (config.includeChristianWritings) {
		const matchers = getBootstrapChristianWritingsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[4],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		await seedCorpus(
			userId,
			projectId,
			projectIndexTypeId,
			groupId,
			matchers,
			counts,
			runId,
			forceRefreshFromSource,
			slugsToSkip,
		);
	}

	// 6) Dead Sea Scrolls
	if (config.includeDeadSeaScrolls) {
		const matchers = getBootstrapDeadSeaScrollsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[5],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		await seedCorpus(
			userId,
			projectId,
			projectIndexTypeId,
			groupId,
			matchers,
			counts,
			runId,
			forceRefreshFromSource,
			slugsToSkip,
		);
	}

	// 7) Extra book keys
	const extraKeys = config.extraBookKeys ?? [];
	if (extraKeys.length > 0) {
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			name: BOOTSTRAP_GROUP_NAMES[6],
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		entryPosition = 0;
		for (let i = 0; i < extraKeys.length; i++) {
			const bookKey = extraKeys[i];
			const slug = slugifyBootstrapKey(bookKey);
			const traditionLabel = getBookLabel(bookKey, canonId);
			const aliases = getMatchersForExtraBookKey(bookKey);
			const label =
				traditionLabel !== bookKey ? traditionLabel : (aliases[0] ?? bookKey);
			const { entryId, created: entryCreated } = await findOrCreateEntry({
				userId,
				projectId,
				projectIndexTypeId,
				slug,
				label,
				seedRunId: runId,
				forceRefreshFromSource,
			});
			if (entryCreated) counts.entriesCreated++;
			else counts.entriesReused++;
			if (slugsToSkip?.has(slug)) {
				entryPosition++;
			} else {
				const added = await ensureEntryInGroup({
					userId,
					groupId,
					entryId,
					position: entryPosition++,
				});
				if (added) counts.membershipsCreated++;
			}
			let matcherPosition = 0;
			for (const raw of aliases) {
				if (!normalize(raw)) continue;
				const { matcherId, created: matcherCreated } =
					await findOrCreateMatcher({
						userId,
						entryId,
						projectIndexTypeId,
						text: raw,
						seedRunId: runId,
					});
				if (matcherCreated) counts.matchersCreated++;
				else counts.matchersReused++;
				const matcherAdded = await ensureMatcherInGroup({
					userId,
					groupId,
					matcherId,
					position: matcherPosition++,
				});
				if (matcherAdded) counts.membershipsCreated++;
			}
		}
	}

	await updateBootstrapRunCounts({ userId, runId, counts });

	logEvent({
		event: "scripture_bootstrap.completed",
		context: {
			requestId,
			userId,
			metadata: {
				projectId,
				projectIndexTypeId,
				configSnapshotHash: hash,
				...counts,
			},
		},
	});

	await insertEvent({
		type: "scripture_bootstrap.run_completed",
		projectId,
		userId,
		metadata: {
			projectIndexTypeId,
			configSnapshotHash: hash,
			entriesCreated: counts.entriesCreated,
			entriesReused: counts.entriesReused,
			matchersCreated: counts.matchersCreated,
			matchersReused: counts.matchersReused,
			groupsCreated: counts.groupsCreated,
			membershipsCreated: counts.membershipsCreated,
		},
		requestId,
	});

	return counts;
}

async function seedCorpus(
	userId: string,
	projectId: string,
	projectIndexTypeId: string,
	groupId: string,
	matchers: Record<string, string[]>,
	counts: BootstrapCounts,
	runId: string,
	forceRefreshFromSource: boolean,
	slugsToSkip: Set<string> | null,
): Promise<void> {
	let entryPosition = 0;
	for (const [key, aliases] of Object.entries(matchers)) {
		const slug = slugifyBootstrapKey(key);
		const label = aliases[0] ?? key;
		const { entryId, created: entryCreated } = await findOrCreateEntry({
			userId,
			projectId,
			projectIndexTypeId,
			slug,
			label,
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (entryCreated) counts.entriesCreated++;
		else counts.entriesReused++;
		if (slugsToSkip?.has(slug)) {
			entryPosition++;
		} else {
			const added = await ensureEntryInGroup({
				userId,
				groupId,
				entryId,
				position: entryPosition++,
			});
			if (added) counts.membershipsCreated++;
		}
		let matcherPosition = 0;
		for (const raw of aliases) {
			if (!normalize(raw)) continue;
			const { matcherId, created: matcherCreated } = await findOrCreateMatcher({
				userId,
				entryId,
				projectIndexTypeId,
				text: raw,
				seedRunId: runId,
			});
			if (matcherCreated) counts.matchersCreated++;
			else counts.matchersReused++;
			const matcherAdded = await ensureMatcherInGroup({
				userId,
				groupId,
				matcherId,
				position: matcherPosition++,
			});
			if (matcherAdded) counts.membershipsCreated++;
		}
	}
}
