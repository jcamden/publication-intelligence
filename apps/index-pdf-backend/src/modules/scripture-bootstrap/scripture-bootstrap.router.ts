import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as scriptureBootstrapService from "./scripture-bootstrap.service";

export const scriptureBootstrapRouter = router({
	run: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
				/** When true, overwrite labels/group names from source; default false preserves user edits */
				forceRefreshFromSource: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await scriptureBootstrapService.run({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
				forceRefreshFromSource: input.forceRefreshFromSource,
			});
		}),
});
