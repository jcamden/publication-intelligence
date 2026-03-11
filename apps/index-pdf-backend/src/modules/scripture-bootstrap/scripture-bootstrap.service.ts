import { TRPCError } from "@trpc/server";
import {
	getBookLabel,
	getBootstrapApocryphaMatchers,
	getBootstrapCanonMatchers,
	getBootstrapChristianWritingsMatchers,
	getBootstrapClassicalWritingsMatchers,
	getBootstrapDeadSeaScrollsMatchers,
	getBootstrapJewishWritingsMatchers,
	getCanonBookKeys,
	getMatchersForExtraBookKey,
	normalize,
	slugifyBootstrapKey,
} from "@pubint/core";
import type { CanonId } from "../scripture-index-config/scripture-index-config.types";
import type { ScriptureIndexConfig } from "../scripture-index-config/scripture-index-config.types";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as scriptureIndexConfigRepo from "../scripture-index-config/scripture-index-config.repo";
import type { BootstrapCounts } from "./scripture-bootstrap.repo";
import {
	BOOTSTRAP_GROUP_SLUGS,
	findOrCreateEntry,
	findOrCreateGroup,
	findOrCreateMatcher,
	ensureEntryInGroup,
	ensureMatcherInGroup,
	insertBootstrapRunStart,
	updateBootstrapRunCounts,
} from "./scripture-bootstrap.repo";

function configSnapshotHash(config: ScriptureIndexConfig): string {
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

/**
 * Run scripture bootstrap: seed entries/matchers/groups from config.
 * Fails fast when selected_canon is missing. Idempotent for same config.
 * Re-bootstrap reuses rows by stable keys and preserves user edits unless forceRefreshFromSource is true.
 */
export async function run({
	projectId,
	projectIndexTypeId,
	userId,
	requestId,
	forceRefreshFromSource = false,
}: {
	projectId: string;
	projectIndexTypeId: string;
	userId: string;
	requestId: string;
	/** When true, overwrite labels/group names from source; default false preserves user edits */
	forceRefreshFromSource?: boolean;
}): Promise<BootstrapCounts> {
	const config = await scriptureIndexConfigRepo.getScriptureConfig({
		projectId,
		projectIndexTypeId,
		userId,
	});

	if (!config) {
		logEvent({
			event: "scripture_bootstrap.config_missing",
			context: { requestId, userId, metadata: { projectId, projectIndexTypeId } },
		});
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Scripture index config not found. Save canon and corpus options first.",
		});
	}

	if (!config.selectedCanon) {
		logEvent({
			event: "scripture_bootstrap.rejected_no_canon",
			context: { requestId, userId, metadata: { projectId, projectIndexTypeId } },
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
	const { groupId: canonGroupId, created: canonGroupCreated } =
		await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			slug: BOOTSTRAP_GROUP_SLUGS[0].slug,
			name: BOOTSTRAP_GROUP_SLUGS[0].name,
			parserProfileId: "scripture-biblical",
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
		const added = await ensureEntryInGroup({
			userId,
			groupId: canonGroupId,
			entryId,
			position: entryPosition++,
		});
		if (added) counts.membershipsCreated++;
		let matcherPosition = 0;
		for (const raw of aliases) {
			const text = normalize(raw);
			if (!text) continue;
			const { matcherId, created: matcherCreated } = await findOrCreateMatcher({
				userId,
				entryId,
				projectIndexTypeId,
				normalizedText: text,
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
			slug: BOOTSTRAP_GROUP_SLUGS[1].slug,
			name: BOOTSTRAP_GROUP_SLUGS[1].name,
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		entryPosition = 0;
		for (const [key, aliases] of Object.entries(apocMatchers)) {
			const slug = slugifyBootstrapKey(key);
			const label = getBookLabel(key, canonId);
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
			const added = await ensureEntryInGroup({
				userId,
				groupId,
				entryId,
				position: entryPosition++,
			});
			if (added) counts.membershipsCreated++;
			let matcherPosition = 0;
			for (const raw of aliases) {
				const text = normalize(raw);
				if (!text) continue;
				const { matcherId, created: matcherCreated } =
					await findOrCreateMatcher({
						userId,
						entryId,
						projectIndexTypeId,
						normalizedText: text,
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
			slug: BOOTSTRAP_GROUP_SLUGS[2].slug,
			name: BOOTSTRAP_GROUP_SLUGS[2].name,
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
		);
	}

	// 4) Classical Writings
	if (config.includeClassicalWritings) {
		const matchers = getBootstrapClassicalWritingsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			slug: BOOTSTRAP_GROUP_SLUGS[3].slug,
			name: BOOTSTRAP_GROUP_SLUGS[3].name,
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
		);
	}

	// 5) Christian Writings
	if (config.includeChristianWritings) {
		const matchers = getBootstrapChristianWritingsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			slug: BOOTSTRAP_GROUP_SLUGS[4].slug,
			name: BOOTSTRAP_GROUP_SLUGS[4].name,
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
		);
	}

	// 6) Dead Sea Scrolls
	if (config.includeDeadSeaScrolls) {
		const matchers = getBootstrapDeadSeaScrollsMatchers();
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			slug: BOOTSTRAP_GROUP_SLUGS[5].slug,
			name: BOOTSTRAP_GROUP_SLUGS[5].name,
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
		);
	}

	// 7) Extra book keys
	const extraKeys = config.extraBookKeys ?? [];
	if (extraKeys.length > 0) {
		const { groupId, created } = await findOrCreateGroup({
			userId,
			projectId,
			projectIndexTypeId,
			slug: BOOTSTRAP_GROUP_SLUGS[6].slug,
			name: BOOTSTRAP_GROUP_SLUGS[6].name,
			seedRunId: runId,
			forceRefreshFromSource,
		});
		if (created) counts.groupsCreated++;
		entryPosition = 0;
		for (let i = 0; i < extraKeys.length; i++) {
			const bookKey = extraKeys[i];
			const slug = slugifyBootstrapKey(bookKey);
			const label = getBookLabel(bookKey, canonId);
			const aliases = getMatchersForExtraBookKey(bookKey);
			const { entryId, created: entryCreated } = await findOrCreateEntry({
				userId,
				projectId,
				projectIndexTypeId,
				slug,
				label: label !== bookKey ? label : bookKey,
				seedRunId: runId,
				forceRefreshFromSource,
			});
			if (entryCreated) counts.entriesCreated++;
			else counts.entriesReused++;
			const added = await ensureEntryInGroup({
				userId,
				groupId,
				entryId,
				position: entryPosition++,
			});
			if (added) counts.membershipsCreated++;
			let matcherPosition = 0;
			for (const raw of aliases) {
				const text = normalize(raw);
				if (!text) continue;
				const { matcherId, created: matcherCreated } =
					await findOrCreateMatcher({
						userId,
						entryId,
						projectIndexTypeId,
						normalizedText: text,
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
		entityId: null,
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
): Promise<void> {
	let entryPosition = 0;
	for (const [key, aliases] of Object.entries(matchers)) {
		const slug = slugifyBootstrapKey(key);
		const label = key;
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
		const added = await ensureEntryInGroup({
			userId,
			groupId,
			entryId,
			position: entryPosition++,
		});
		if (added) counts.membershipsCreated++;
		let matcherPosition = 0;
		for (const raw of aliases) {
			const text = normalize(raw);
			if (!text) continue;
			const { matcherId, created: matcherCreated } = await findOrCreateMatcher({
				userId,
				entryId,
				projectIndexTypeId,
				normalizedText: text,
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
