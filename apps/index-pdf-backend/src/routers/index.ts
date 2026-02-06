import { authRouter } from "../modules/auth/auth.router";
import { projectRouter } from "../modules/project/project.router";
import { projectIndexTypeRouter } from "../modules/project-index-type/project-index-type.router";
import { sourceDocumentRouter } from "../modules/source-document/sourceDocument.router";
import { userRouter } from "../modules/user/user.router";
import { router } from "../trpc";

export const appRouter = router({
	auth: authRouter,
	project: projectRouter,
	projectIndexType: projectIndexTypeRouter,
	sourceDocument: sourceDocumentRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;
