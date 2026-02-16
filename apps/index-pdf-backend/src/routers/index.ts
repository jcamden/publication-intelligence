import { authRouter } from "../modules/auth/auth.router";
import { canonicalPageRuleRouter } from "../modules/canonical-page-rule/canonical-page-rule.router";
import { detectionRouter } from "../modules/detection/detection.router";
import { indexEntryRouter } from "../modules/index-entry/index-entry.router";
import { indexMentionRouter } from "../modules/index-mention/index-mention.router";
import { projectRouter } from "../modules/project/project.router";
import { projectIndexTypeRouter } from "../modules/project-highlight-config/project-highlight-config.router";
import { projectSettingsRouter } from "../modules/project-settings/project-settings.router";
import { regionRouter } from "../modules/region/region.router";
import { sourceDocumentRouter } from "../modules/source-document/sourceDocument.router";
import { userRouter } from "../modules/user/user.router";
import { userSettingsRouter } from "../modules/user-settings/user-settings.router";
import { router } from "../trpc";

export const appRouter = router({
	auth: authRouter,
	canonicalPageRule: canonicalPageRuleRouter,
	detection: detectionRouter,
	region: regionRouter,
	indexEntry: indexEntryRouter,
	indexMention: indexMentionRouter,
	project: projectRouter,
	projectIndexType: projectIndexTypeRouter,
	projectSettings: projectSettingsRouter,
	sourceDocument: sourceDocumentRouter,
	user: userRouter,
	userSettings: userSettingsRouter,
});

export type AppRouter = typeof appRouter;

// Re-export types for frontend consumption
export type {
	CanonicalPageRule,
	CanonicalPageRuleListItem,
	CreateRuleInput,
	DeleteRuleInput,
	RuleConflict,
	UpdateRuleInput,
} from "../modules/canonical-page-rule/canonical-page-rule.types";
export type {
	DetectionRun,
	DetectionRunListItem,
	RunDetectionInput,
} from "../modules/detection/detection.types";
export type {
	CreateCrossReferenceInput,
	CreateIndexEntryInput,
	CrossReference,
	DeleteCrossReferenceInput,
	DeleteIndexEntryInput,
	IndexEntry,
	IndexEntryListItem,
	IndexMatcher,
	TransferMatchersInput,
	TransferMentionsInput,
	UpdateIndexEntryInput,
} from "../modules/index-entry/index-entry.types";
export type {
	CreateIndexMentionInput,
	DeleteIndexMentionInput,
	IndexMention,
	IndexMentionListItem,
	UpdateIndexMentionInput,
} from "../modules/index-mention/index-mention.types";
export type {
	OpenRouterModel,
	ProjectSettings,
} from "../modules/project-settings/project-settings.types";
export type {
	CreateRegionInput,
	DeleteRegionInput,
	Region,
	RegionListItem,
	UpdateRegionInput,
} from "../modules/region/region.types";
export type { UserSettings } from "../modules/user-settings/user-settings.types";
