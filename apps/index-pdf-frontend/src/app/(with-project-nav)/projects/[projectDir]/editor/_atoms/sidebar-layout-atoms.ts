import { atomWithStorage } from "jotai/utils";
import type { EditorSectionId } from "../_types/editor-section-types";
import {
	migratePageSectionIdList,
	migrateProjectSectionIdList,
} from "./migrate-section-storage";

export const projectSidebarCollapsedAtom = atomWithStorage(
	"project-sidebar-collapsed",
	false,
);
export const pageSidebarCollapsedAtom = atomWithStorage(
	"page-sidebar-collapsed",
	false,
);

export const projectSidebarLastVisibleAtom = atomWithStorage<EditorSectionId[]>(
	"project-sidebar-last-visible",
	[],
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as EditorSectionId[];
				return migrateProjectSectionIdList(parsed);
			} catch {
				return initialValue;
			}
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);
export const pageSidebarLastVisibleAtom = atomWithStorage<EditorSectionId[]>(
	"page-sidebar-last-visible",
	[],
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as EditorSectionId[];
				return migratePageSectionIdList(parsed);
			} catch {
				return initialValue;
			}
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);

export const projectAccordionExpandedAtom = atomWithStorage<string[]>(
	"project-accordion-expanded",
	[],
);
export const pageAccordionExpandedAtom = atomWithStorage<string[]>(
	"page-accordion-expanded",
	[],
);

const defaultProjectOrder: EditorSectionId[] = [
	"project-pages",
	"project-regions",
	"project-ai",
	"project-subject",
	"project-author",
	"project-scripture",
];
const defaultPageOrder: EditorSectionId[] = [
	"page-pages",
	"page-regions",
	"page-ai",
	"page-subject",
	"page-author",
	"page-scripture",
];

export const projectSectionOrderAtom = atomWithStorage<EditorSectionId[]>(
	"project-section-order",
	defaultProjectOrder,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as EditorSectionId[];
				return migrateProjectSectionIdList(parsed);
			} catch {
				return initialValue;
			}
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);
export const pageSectionOrderAtom = atomWithStorage<EditorSectionId[]>(
	"page-section-order",
	defaultPageOrder,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as EditorSectionId[];
				return migratePageSectionIdList(parsed);
			} catch {
				return initialValue;
			}
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);

export const projectSidebarWidthAtom = atomWithStorage(
	"project-sidebar-width",
	28.75,
);
export const pageSidebarWidthAtom = atomWithStorage(
	"page-sidebar-width",
	28.75,
);
