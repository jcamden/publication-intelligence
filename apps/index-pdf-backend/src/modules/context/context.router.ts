import { protectedProcedure, router } from "../../trpc";
import * as contextService from "./context.service";
import {
	CreateContextSchema,
	DeleteContextSchema,
	DetectConflictsSchema,
	GetContextsForPageSchema,
	ListContextsSchema,
	UpdateContextSchema,
} from "./context.types";

// ============================================================================
// tRPC Router - HTTP/API layer for Context management
// ============================================================================

export const contextRouter = router({
	list: protectedProcedure
		.input(ListContextsSchema)
		.query(async ({ input, ctx }) => {
			return await contextService.listContexts({
				projectId: input.projectId,
				includeDeleted: input.includeDeleted,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	getForPage: protectedProcedure
		.input(GetContextsForPageSchema)
		.query(async ({ input, ctx }) => {
			return await contextService.getContextsForPage({
				projectId: input.projectId,
				pageNumber: input.pageNumber,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	create: protectedProcedure
		.input(CreateContextSchema)
		.mutation(async ({ input, ctx }) => {
			return await contextService.createContext({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	update: protectedProcedure
		.input(UpdateContextSchema)
		.mutation(async ({ input, ctx }) => {
			return await contextService.updateContext({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	delete: protectedProcedure
		.input(DeleteContextSchema)
		.mutation(async ({ input, ctx }) => {
			return await contextService.deleteContext({
				input,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),

	detectConflicts: protectedProcedure
		.input(DetectConflictsSchema)
		.query(async ({ input, ctx }) => {
			return await contextService.detectConflicts({
				projectId: input.projectId,
				userId: ctx.user.id,
				requestId: ctx.requestId,
			});
		}),
});
