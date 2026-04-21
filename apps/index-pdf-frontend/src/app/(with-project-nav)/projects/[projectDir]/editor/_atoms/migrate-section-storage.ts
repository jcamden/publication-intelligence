import type {
	EditorSectionId,
	EditorSectionState,
} from "../_types/editor-section-types";

const PROJECT_CONTEXT_LEGACY = "project-contexts" as EditorSectionId;
const PAGE_CONTEXT_LEGACY = "page-contexts" as EditorSectionId;

/** Migrates a single stored sidebar section id (contexts → regions). */
export function migrateSidebarSectionId(
	id: EditorSectionId,
	scope: "project" | "page",
): EditorSectionId {
	if (scope === "project" && id === PROJECT_CONTEXT_LEGACY) {
		return "project-regions";
	}
	if (scope === "page" && id === PAGE_CONTEXT_LEGACY) {
		return "page-regions";
	}
	return id;
}

export function migrateProjectSectionIdList(
	ids: EditorSectionId[],
): EditorSectionId[] {
	return ids.map((id) => migrateSidebarSectionId(id, "project"));
}

export function migratePageSectionIdList(
	ids: EditorSectionId[],
): EditorSectionId[] {
	return ids.map((id) => migrateSidebarSectionId(id, "page"));
}

/**
 * Mutates the map parsed from localStorage for `editor-sections-state`:
 * adds regions from legacy context keys, AI sections, etc.
 */
export function migrateStoredSectionsMap(
	storedMap: Map<EditorSectionId, EditorSectionState>,
): void {
	if (!storedMap.has("project-regions")) {
		const oldContextState = storedMap.get(PROJECT_CONTEXT_LEGACY);
		storedMap.set(
			"project-regions",
			oldContextState ?? { visible: false, popped: false },
		);
		storedMap.delete(PROJECT_CONTEXT_LEGACY);
	}
	if (!storedMap.has("page-regions")) {
		const oldContextState = storedMap.get(PAGE_CONTEXT_LEGACY);
		storedMap.set(
			"page-regions",
			oldContextState ?? { visible: false, popped: false },
		);
		storedMap.delete(PAGE_CONTEXT_LEGACY);
	}
	if (!storedMap.has("project-ai")) {
		storedMap.set("project-ai", { visible: false, popped: false });
	}
	if (!storedMap.has("page-ai")) {
		storedMap.set("page-ai", { visible: false, popped: false });
	}
}
