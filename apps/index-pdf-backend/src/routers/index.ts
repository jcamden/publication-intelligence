import { authRouter } from "../modules/auth/auth.router";
import { projectRouter } from "../modules/project/project.router";
import { sourceDocumentRouter } from "../modules/source-document/sourceDocument.router";
import { router } from "../trpc";

export const appRouter = router({
	auth: authRouter,
	project: projectRouter,
	sourceDocument: sourceDocumentRouter,
});

export type AppRouter = typeof appRouter;
