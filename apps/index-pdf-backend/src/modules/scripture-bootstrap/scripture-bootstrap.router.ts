import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import * as scriptureBootstrapService from "./scripture-bootstrap.service";

export const scriptureBootstrapRouter = router({
	run: protectedProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				projectIndexTypeId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await scriptureBootstrapService.run({
				projectId: input.projectId,
				projectIndexTypeId: input.projectIndexTypeId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
