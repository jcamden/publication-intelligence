import { logEvent } from "../../logger";
import { protectedProcedure, router } from "../../trpc";
import { deleteUser } from "./user.service";

export const userRouter = router({
	deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.user.id;
		const { requestId } = ctx;

		logEvent({
			event: "user.account_deletion_requested",
			context: {
				requestId,
				userId,
			},
		});

		try {
			await deleteUser({ userId });

			logEvent({
				event: "user.account_deleted",
				context: {
					requestId,
					userId,
				},
			});

			return { success: true, message: "Account deleted successfully" };
		} catch (error) {
			logEvent({
				event: "user.account_deletion_failed",
				context: {
					requestId,
					userId,
					error,
				},
			});
			throw error;
		}
	}),
});
