import { projectRouter } from "../modules/project/project.router";
import { router } from "../trpc";
import { authRouter } from "./auth";

export const appRouter = router({
	auth: authRouter,
	project: projectRouter,
});

export type AppRouter = typeof appRouter;
