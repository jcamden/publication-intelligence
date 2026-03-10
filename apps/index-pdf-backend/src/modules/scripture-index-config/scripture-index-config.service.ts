import { TRPCError } from "@trpc/server";
import { isValidCanonId } from "@pubint/core";
import { logEvent } from "../../logger";
import { insertEvent } from "../event/event.repo";
import * as scriptureIndexConfigRepo from "./scripture-index-config.repo";
import type {
	ScriptureIndexConfig,
	UpsertScriptureConfigInput,
} from "./scripture-index-config.types";

const SCRIPTURE_HIGHLIGHT_TYPE = "scripture";

export async function getScriptureConfig({
	projectId,
	projectIndexTypeId,
	userId,
	requestId,
}: {
	projectId: string;
	projectIndexTypeId: string;
	userId: string;
	requestId: string;
}): Promise<ScriptureIndexConfig | null> {
	logEvent({
		event: "scripture_index_config.get_requested",
		context: {
			requestId,
			userId,
			metadata: { projectId, projectIndexTypeId },
		},
	});

	return await scriptureIndexConfigRepo.getScriptureConfig({
		projectId,
		projectIndexTypeId,
		userId,
	});
}

export async function upsertScriptureConfig({
	input,
	userId,
	requestId,
}: {
	input: UpsertScriptureConfigInput;
	userId: string;
	requestId: string;
}): Promise<ScriptureIndexConfig> {
	// Validate single canon: selectedCanon is one id or null (no multi-canon)
	if (input.selectedCanon !== null && !isValidCanonId(input.selectedCanon)) {
		logEvent({
			event: "scripture_index_config.validation_failed",
			context: {
				requestId,
				userId,
				metadata: {
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					reason: "invalid_canon_id",
					selectedCanon: input.selectedCanon,
				},
			},
		});
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid canon id: ${input.selectedCanon}. Must be one of: protestant, roman_catholic, tanakh, eastern_orthodox.`,
		});
	}

	// Enforce scripture-type index only
	const highlightType =
		await scriptureIndexConfigRepo.getProjectIndexTypeHighlightType({
			projectIndexTypeId: input.projectIndexTypeId,
			userId,
		});

	if (highlightType !== SCRIPTURE_HIGHLIGHT_TYPE) {
		logEvent({
			event: "scripture_index_config.rejected_non_scripture",
			context: {
				requestId,
				userId,
				metadata: {
					projectId: input.projectId,
					projectIndexTypeId: input.projectIndexTypeId,
					highlightType: highlightType ?? "not_found",
				},
			},
		});
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Scripture config can only be set for a scripture-type index. This project index type is not scripture.",
		});
	}

	const before =
		await scriptureIndexConfigRepo.getScriptureConfig({
			projectId: input.projectId,
			projectIndexTypeId: input.projectIndexTypeId,
			userId,
		});

	const config = await scriptureIndexConfigRepo.upsertScriptureConfig({
		input,
		userId,
	});

	logEvent({
		event: "scripture_index_config.upserted",
		context: {
			requestId,
			userId,
			metadata: {
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				configId: config.id,
				before:
					before != null
						? {
								selectedCanon: before.selectedCanon,
								includeApocrypha: before.includeApocrypha,
								includeJewishWritings: before.includeJewishWritings,
								includeClassicalWritings: before.includeClassicalWritings,
								includeChristianWritings: before.includeChristianWritings,
								includeDeadSeaScrolls: before.includeDeadSeaScrolls,
							}
						: null,
				after: {
					selectedCanon: config.selectedCanon,
					includeApocrypha: config.includeApocrypha,
					includeJewishWritings: config.includeJewishWritings,
					includeClassicalWritings: config.includeClassicalWritings,
					includeChristianWritings: config.includeChristianWritings,
					includeDeadSeaScrolls: config.includeDeadSeaScrolls,
				},
			},
		},
	});

	await insertEvent({
		type: "scripture_index_config.updated",
		projectId: input.projectId,
		userId,
		entityId: config.id,
		metadata: {
			projectIndexTypeId: input.projectIndexTypeId,
			selectedCanon: config.selectedCanon,
			includeApocrypha: config.includeApocrypha,
			includeJewishWritings: config.includeJewishWritings,
			includeClassicalWritings: config.includeClassicalWritings,
			includeChristianWritings: config.includeChristianWritings,
			includeDeadSeaScrolls: config.includeDeadSeaScrolls,
			updatedAt: config.updatedAt,
		},
		requestId,
	});

	return config;
}
