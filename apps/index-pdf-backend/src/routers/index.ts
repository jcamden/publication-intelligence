import { authRouter } from "../modules/auth/auth.router";
import { indexEntryRouter } from "../modules/index-entry/index-entry.router";
import { indexMentionRouter } from "../modules/index-mention/index-mention.router";
import { projectRouter } from "../modules/project/project.router";
import { projectIndexTypeRouter } from "../modules/project-index-type/project-index-type.router";
import { sourceDocumentRouter } from "../modules/source-document/sourceDocument.router";
import { userRouter } from "../modules/user/user.router";
import { router } from "../trpc";

export const appRouter = router({
	auth: authRouter,
	indexEntry: indexEntryRouter,
	indexMention: indexMentionRouter,
	project: projectRouter,
	projectIndexType: projectIndexTypeRouter,
	sourceDocument: sourceDocumentRouter,
	user: userRouter,
});

export type AppRouter = typeof appRouter;

// Re-export types for frontend consumption
export type {
	CreateIndexEntryInput,
	DeleteIndexEntryInput,
	IndexEntry,
	IndexEntryListItem,
	UpdateIndexEntryInput,
} from "../modules/index-entry/index-entry.types";

export type {
	CreateIndexMentionInput,
	DeleteIndexMentionInput,
	IndexMention,
	IndexMentionListItem,
	UpdateIndexMentionInput,
} from "../modules/index-mention/index-mention.types";
