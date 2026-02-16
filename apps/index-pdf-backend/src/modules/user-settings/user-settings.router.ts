import { protectedProcedure, router } from "../../trpc";
import * as userSettingsService from "./user-settings.service";
import {
	GetUserSettingsSchema,
	ListModelsSchema,
	UpdateUserSettingsSchema,
} from "./user-settings.types";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const userSettingsRouter = router({
	get: protectedProcedure
		.input(GetUserSettingsSchema)
		.query(async ({ ctx }) => {
			return await userSettingsService.getUserSettings({
				userId: ctx.user.id,
				input: {},
			});
		}),

	update: protectedProcedure
		.input(UpdateUserSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			return await userSettingsService.updateUserSettings({
				userId: ctx.user.id,
				input,
			});
		}),

	listModels: protectedProcedure
		.input(ListModelsSchema)
		.query(async ({ ctx }) => {
			return await userSettingsService.listAvailableModels({
				userId: ctx.user.id,
			});
		}),
});
