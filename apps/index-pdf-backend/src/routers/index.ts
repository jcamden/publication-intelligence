import { authRouter } from "../modules/auth/auth.router";
import { projectRouter } from "../modules/project/project.router";
import { router } from "../trpc";

export const appRouter = router({
	auth: authRouter,
	project: projectRouter,
});

export type AppRouter = typeof appRouter;
