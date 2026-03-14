import { CANON_IDS } from "@pubint/core";
import { z } from "zod";

// Canon id enum for input validation (single canon only)
export const canonIdSchema = z.enum(CANON_IDS);
export type CanonId = z.infer<typeof canonIdSchema>;

export const upsertScriptureConfigSchema = z.object({
	projectId: z.string().uuid(),
	projectIndexTypeId: z.string().uuid(),
	selectedCanon: canonIdSchema.nullable(),
	includeApocrypha: z.boolean(),
	includeJewishWritings: z.boolean(),
	includeClassicalWritings: z.boolean(),
	includeChristianWritings: z.boolean(),
	includeDeadSeaScrolls: z.boolean(),
	alwaysDisplayUnknownEntry: z.boolean().default(false),
	extraBookKeys: z.array(z.string()).default([]),
});

export type UpsertScriptureConfigInput = z.infer<
	typeof upsertScriptureConfigSchema
>;

export type ScriptureIndexConfig = {
	id: string;
	projectId: string;
	projectIndexTypeId: string;
	selectedCanon: CanonId | null;
	includeApocrypha: boolean;
	includeJewishWritings: boolean;
	includeClassicalWritings: boolean;
	includeChristianWritings: boolean;
	includeDeadSeaScrolls: boolean;
	alwaysDisplayUnknownEntry: boolean;
	extraBookKeys: string[];
	createdAt: string;
	updatedAt: string | null;
};
