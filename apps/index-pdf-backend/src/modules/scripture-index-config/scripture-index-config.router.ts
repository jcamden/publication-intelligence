import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as scriptureIndexConfigService from "./scripture-index-config.service";
import { upsertScriptureConfigSchema } from "./scripture-index-config.types";

export const scriptureIndexConfigRouter = router({
	get: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await scriptureIndexConfigService.getScriptureConfig({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	upsert: protectedProcedure
		.input(upsertScriptureConfigSchema)
		.mutation(async ({ ctx, input }) => {
			return await scriptureIndexConfigService.upsertScriptureConfig({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
