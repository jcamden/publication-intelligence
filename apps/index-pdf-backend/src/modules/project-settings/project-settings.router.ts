import { protectedProcedure, router } from "../../trpc";
import * as projectSettingsService from "./project-settings.service";
import {
	GetProjectSettingsSchema,
	ListModelsSchema,
	UpdateProjectSettingsSchema,
} from "./project-settings.types";

// ============================================================================
// tRPC Router - HTTP/API layer
// ============================================================================

export const projectSettingsRouter = router({
	get: protectedProcedure
		.input(GetProjectSettingsSchema)
		.query(async ({ ctx, input }) => {
			return await projectSettingsService.getProjectSettings({
				userId: ctx.user.id,
				input,
			});
		}),

	update: protectedProcedure
		.input(UpdateProjectSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			return await projectSettingsService.updateProjectSettings({
				userId: ctx.user.id,
				input,
			});
		}),

	listModels: protectedProcedure.input(ListModelsSchema).query(async () => {
		return await projectSettingsService.listAvailableModels();
	}),
});
