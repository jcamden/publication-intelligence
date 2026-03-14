import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { canonIdSchema } from "../scripture-index-config/scripture-index-config.types";
import * as scriptureBootstrapService from "./scripture-bootstrap.service";

const addEntriesConfigSchema = z.object({
	selectedCanon: canonIdSchema.nullable(),
	includeApocrypha: z.boolean(),
	includeJewishWritings: z.boolean(),
	includeClassicalWritings: z.boolean(),
	includeChristianWritings: z.boolean(),
	includeDeadSeaScrolls: z.boolean(),
	extraBookKeys: z.array(z.string()).default([]),
});

export const scriptureBootstrapRouter = router({
	run: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
				/** Form config: canon, corpora, extra books. Passed from frontend; not persisted. */
				config: addEntriesConfigSchema,
				/** When true, overwrite labels/group names from source; default false preserves user edits */
				forceRefreshFromSource: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await scriptureBootstrapService.run({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				config: input.config,
				userId: ctx.user.id,
				requestId: ctx.requestId,
				forceRefreshFromSource: input.forceRefreshFromSource,
			});
		}),
});
