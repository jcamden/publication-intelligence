import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
	EditorSectionId,
	EditorSectionState,
} from "../_types/editor-section-types";
import { migrateStoredSectionsMap } from "./migrate-section-storage";

const initialEditorSections = new Map<EditorSectionId, EditorSectionState>([
	["project-pages", { visible: false, popped: false }],
	["project-subject", { visible: true, popped: false }],
	["project-author", { visible: false, popped: false }],
	["project-scripture", { visible: false, popped: false }],
	["project-regions", { visible: false, popped: false }],
	["project-ai", { visible: false, popped: false }],
	["page-pages", { visible: false, popped: false }],
	["page-subject", { visible: true, popped: false }],
	["page-author", { visible: false, popped: false }],
	["page-scripture", { visible: false, popped: false }],
	["page-regions", { visible: false, popped: false }],
	["page-ai", { visible: false, popped: false }],
]);

export const editorSectionsStateAtom = atomWithStorage<
	Map<EditorSectionId, EditorSectionState>
>("editor-sections-state", initialEditorSections, {
	getItem: (key, initialValue) => {
		const stored = localStorage.getItem(key);
		if (!stored) return initialValue;
		try {
			const parsed = JSON.parse(stored);
			const storedMap = new Map(Object.entries(parsed)) as Map<
				EditorSectionId,
				EditorSectionState
			>;
			migrateStoredSectionsMap(storedMap);
			return storedMap;
		} catch {
			return initialValue;
		}
	},
	setItem: (key, value) => {
		const obj = Object.fromEntries(value);
		localStorage.setItem(key, JSON.stringify(obj));
	},
	removeItem: (key) => localStorage.removeItem(key),
});

export const orderedWindowsAtom = atom<EditorSectionId[]>([]);

export const windowsToRenderAtom = atom((get) => {
	const sections = get(editorSectionsStateAtom);

	return Array.from(sections.entries())
		.filter(([_id, state]) => {
			return state.visible && state.popped;
		})
		.map(([id, state]) => ({ id, state }));
});

export const updateSectionAtom = atom(
	null,
	(
		get,
		set,
		update: { id: EditorSectionId; changes: Partial<EditorSectionState> },
	) => {
		const sections = new Map(get(editorSectionsStateAtom));
		const current = sections.get(update.id);
		if (current) {
			sections.set(update.id, { ...current, ...update.changes });
			set(editorSectionsStateAtom, sections);
		}
	},
);

export const moveWindowToFrontAtom = atom(
	null,
	(get, set, windowId: EditorSectionId) => {
		const ordered = get(orderedWindowsAtom);
		const index = ordered.indexOf(windowId);

		if (index === -1) {
			set(orderedWindowsAtom, [...ordered, windowId]);
		} else if (index < ordered.length - 1) {
			const newOrder = [...ordered];
			newOrder.splice(index, 1);
			newOrder.push(windowId);
			set(orderedWindowsAtom, newOrder);
		}
	},
);
