import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
	ColorConfig,
	HighlightColorConfig,
	RegionTypeColorConfig,
} from "../_types/highlight-config";
import { DEFAULT_HIGHLIGHT_COLOR_CONFIG } from "../_types/highlight-config";

// Section IDs
export type SectionId =
	| "project-pages"
	| "project-subject"
	| "project-author"
	| "project-scripture"
	| "project-biblio"
	| "project-regions"
	| "project-ai"
	| "page-info"
	| "page-pages"
	| "page-subject"
	| "page-author"
	| "page-scripture"
	| "page-biblio"
	| "page-regions"
	| "page-ai";

// Section state type
export type SectionState = {
	visible: boolean;
	popped: boolean;
	windowState?: {
		position: { x: number; y: number };
		size: { width: number; height: number };
		isMaximized: boolean;
		lastRestorePosition?: { x: number; y: number };
		lastRestoreSize?: { width: number; height: number };
		side?: "left" | "right";
	};
};

// Initial state with subject indices visible by default
const initialSections = new Map<SectionId, SectionState>([
	["project-pages", { visible: false, popped: false }],
	["project-subject", { visible: true, popped: false }], // visible by default
	["project-author", { visible: false, popped: false }],
	["project-scripture", { visible: false, popped: false }],
	["project-regions", { visible: false, popped: false }],
	["project-ai", { visible: false, popped: false }],
	["page-pages", { visible: false, popped: false }],
	["page-subject", { visible: true, popped: false }], // visible by default
	["page-author", { visible: false, popped: false }],
	["page-scripture", { visible: false, popped: false }],
	["page-regions", { visible: false, popped: false }],
	["page-ai", { visible: false, popped: false }],
]);

// Main sections state with localStorage persistence
export const sectionsStateAtom = atomWithStorage<Map<SectionId, SectionState>>(
	"editor-sections-state",
	initialSections,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored);
				const storedMap = new Map(Object.entries(parsed)) as Map<
					SectionId,
					SectionState
				>;

				// Migration: Add new region sections if they don't exist
				// Also migrate old context sections to regions
				if (!storedMap.has("project-regions")) {
					const oldContextState = storedMap.get(
						"project-contexts" as SectionId,
					);
					storedMap.set(
						"project-regions",
						oldContextState ?? { visible: false, popped: false },
					);
					// Clean up old context section
					storedMap.delete("project-contexts" as SectionId);
				}
				if (!storedMap.has("page-regions")) {
					const oldContextState = storedMap.get("page-contexts" as SectionId);
					storedMap.set(
						"page-regions",
						oldContextState ?? { visible: false, popped: false },
					);
					// Clean up old context section
					storedMap.delete("page-contexts" as SectionId);
				}

				// Migration: Add new AI sections if they don't exist
				if (!storedMap.has("project-ai")) {
					storedMap.set("project-ai", { visible: false, popped: false });
				}
				if (!storedMap.has("page-ai")) {
					storedMap.set("page-ai", { visible: false, popped: false });
				}

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
	},
);

// Sidebar collapse state (also persisted)
export const projectSidebarCollapsedAtom = atomWithStorage(
	"project-sidebar-collapsed",
	false,
);
export const pageSidebarCollapsedAtom = atomWithStorage(
	"page-sidebar-collapsed",
	false,
);

// Track which sections were visible in sidebar when collapsed (for restoration)
export const projectSidebarLastVisibleAtom = atomWithStorage<SectionId[]>(
	"project-sidebar-last-visible",
	[],
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as SectionId[];
				// Migration: Replace old context section with regions
				return parsed.map((id) =>
					id === ("project-contexts" as SectionId) ? "project-regions" : id,
				) as SectionId[];
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
export const pageSidebarLastVisibleAtom = atomWithStorage<SectionId[]>(
	"page-sidebar-last-visible",
	[],
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as SectionId[];
				// Migration: Replace old context section with regions
				return parsed.map((id) =>
					id === ("page-contexts" as SectionId) ? "page-regions" : id,
				) as SectionId[];
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

// Track which accordion items are expanded (persisted)
export const projectAccordionExpandedAtom = atomWithStorage<string[]>(
	"project-accordion-expanded",
	[],
);
export const pageAccordionExpandedAtom = atomWithStorage<string[]>(
	"page-accordion-expanded",
	[],
);

// Track section ordering (persisted) - only the section IDs, not the toggle button
const defaultProjectOrder: SectionId[] = [
	"project-pages",
	"project-regions",
	"project-ai",
	"project-subject",
	"project-author",
	"project-scripture",
];
const defaultPageOrder: SectionId[] = [
	"page-pages",
	"page-regions",
	"page-ai",
	"page-subject",
	"page-author",
	"page-scripture",
];

export const projectSectionOrderAtom = atomWithStorage<SectionId[]>(
	"project-section-order",
	defaultProjectOrder,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as SectionId[];
				// Migration: Replace old context section with regions
				return parsed.map((id) =>
					id === ("project-contexts" as SectionId) ? "project-regions" : id,
				) as SectionId[];
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
export const pageSectionOrderAtom = atomWithStorage<SectionId[]>(
	"page-section-order",
	defaultPageOrder,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (!stored) return initialValue;
			try {
				const parsed = JSON.parse(stored) as SectionId[];
				// Migration: Replace old context section with regions
				return parsed.map((id) =>
					id === ("page-contexts" as SectionId) ? "page-regions" : id,
				) as SectionId[];
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

// Sidebar widths in rem (persisted)
export const projectSidebarWidthAtom = atomWithStorage(
	"project-sidebar-width",
	28.75,
); // rem
export const pageSidebarWidthAtom = atomWithStorage(
	"page-sidebar-width",
	28.75,
); // rem

// PDF section visibility and width memory
export const pdfSectionVisibleAtom = atomWithStorage(
	"pdf-section-visible",
	true,
);
export const pdfSectionLastWidthAtom = atomWithStorage(
	"pdf-section-last-width",
	50,
); // rem

// Minimum widths in rem (constants, not persisted)
export const MIN_SIDEBAR_WIDTH = 18.75; // minimum sidebar width (300px @ 16px/rem)
export const MIN_PDF_WIDTH = 15; // minimum PDF width before auto-hide (240px @ 16px/rem)
export const PDF_RESTORE_MARGIN = 3; // extra space when restoring from drag-hidden (48px @ 16px/rem)

// Z-order for window stacking (not persisted - resets on page load)
export const orderedWindowsAtom = atom<SectionId[]>([]);

// Derived atom: which windows should render
export const windowsToRenderAtom = atom((get) => {
	const sections = get(sectionsStateAtom);

	return Array.from(sections.entries())
		.filter(([_id, state]) => {
			// Only render windows for sections that are visible AND popped
			return state.visible && state.popped;
		})
		.map(([id, state]) => ({ id, state }));
});

// Helper atoms for updating individual sections
export const updateSectionAtom = atom(
	null,
	(get, set, update: { id: SectionId; changes: Partial<SectionState> }) => {
		const sections = new Map(get(sectionsStateAtom));
		const current = sections.get(update.id);
		if (current) {
			sections.set(update.id, { ...current, ...update.changes });
			set(sectionsStateAtom, sections);
		}
	},
);

// Helper to move window to front
export const moveWindowToFrontAtom = atom(
	null,
	(get, set, windowId: SectionId) => {
		const ordered = get(orderedWindowsAtom);
		const index = ordered.indexOf(windowId);

		if (index === -1) {
			// Add to end if not present
			set(orderedWindowsAtom, [...ordered, windowId]);
		} else if (index < ordered.length - 1) {
			// Move to end if not already there
			const newOrder = [...ordered];
			newOrder.splice(index, 1);
			newOrder.push(windowId);
			set(orderedWindowsAtom, newOrder);
		}
	},
);

// Responsive mode detection using Tailwind breakpoint
export const isResponsiveModeAtom = atom(() => {
	// Use matchMedia for Tailwind lg breakpoint (1024px)
	if (typeof window === "undefined") return false;
	return window.matchMedia("(max-width: 1023px)").matches;
});

// Active layer in responsive mode
export type ResponsiveLayer =
	| "pdf"
	| "project-sidebar"
	| "page-sidebar"
	| "section";
export const activeResponsiveLayerAtom = atomWithStorage<ResponsiveLayer>(
	"active-responsive-layer",
	"pdf",
);

// Active section when layer is 'section'
export const activeResponsiveSectionAtom = atom<SectionId | null>(null);

// PDF viewer state atoms (persisted)
export const currentPageAtom = atomWithStorage("pdf-current-page", 1);
export const totalPagesAtom = atom(0); // Not persisted - recalculated on load
export const zoomAtom = atomWithStorage("pdf-zoom", 1.7);
export const pdfUrlAtom = atom<string | null>(null); // Not persisted - set on load

// IndexEntry, IndexType, and Mentions state migrated to tRPC queries in Phase 5
// These atoms have been removed - data is now fetched from backend via tRPC
// See: editor.tsx for tRPC query usage

// Unified highlight color configuration (persisted)
// Includes both index types (subject, author, scripture) and region types (exclude, page_number)
export const highlightColorConfigAtom = atomWithStorage<HighlightColorConfig>(
	"highlight-color-config",
	DEFAULT_HIGHLIGHT_COLOR_CONFIG,
	{
		getItem: (key, initialValue) => {
			const stored = localStorage.getItem(key);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					// Migrate from new unified format
					if (
						parsed.subject &&
						parsed.author &&
						parsed.scripture &&
						parsed.exclude &&
						parsed.page_number
					) {
						return parsed as HighlightColorConfig;
					}
				} catch {
					// Fall through to migration
				}
			}

			// Try migrating from old separate configs
			const oldColorConfig = localStorage.getItem("color-config");
			const oldRegionConfig = localStorage.getItem("region-type-color-config");

			let migrated = { ...initialValue };

			if (oldColorConfig) {
				try {
					const parsed = JSON.parse(oldColorConfig);
					migrated = {
						...migrated,
						subject: { hue: parsed.subject?.hue ?? initialValue.subject.hue },
						author: { hue: parsed.author?.hue ?? initialValue.author.hue },
						scripture: {
							hue: parsed.scripture?.hue ?? initialValue.scripture.hue,
						},
					};
				} catch {
					// Keep defaults
				}
			}

			if (oldRegionConfig) {
				try {
					const parsed = JSON.parse(oldRegionConfig);
					migrated = {
						...migrated,
						exclude: { hue: parsed.exclude?.hue ?? initialValue.exclude.hue },
						page_number: {
							hue: parsed.page_number?.hue ?? initialValue.page_number.hue,
						},
					};
				} catch {
					// Keep defaults
				}
			}

			return migrated;
		},
		setItem: (key, value) => {
			localStorage.setItem(key, JSON.stringify(value));
		},
		removeItem: (key) => localStorage.removeItem(key),
	},
);

// Legacy atoms for backward compatibility (derived from unified atom)
export const colorConfigAtom = atom(
	(get) => {
		const config = get(highlightColorConfigAtom);
		return {
			subject: config.subject,
			author: config.author,
			scripture: config.scripture,
		} as ColorConfig;
	},
	(get, set, update: ColorConfig | ((prev: ColorConfig) => ColorConfig)) => {
		const current = get(highlightColorConfigAtom);
		const currentColorConfig = {
			subject: current.subject,
			author: current.author,
			scripture: current.scripture,
		} as ColorConfig;
		const newConfig =
			typeof update === "function" ? update(currentColorConfig) : update;
		set(highlightColorConfigAtom, {
			...current,
			...newConfig,
		});
	},
);

export const regionTypeColorConfigAtom = atom(
	(get) => {
		const config = get(highlightColorConfigAtom);
		return {
			exclude: config.exclude,
			page_number: config.page_number,
		} as RegionTypeColorConfig;
	},
	(
		get,
		set,
		update:
			| RegionTypeColorConfig
			| ((prev: RegionTypeColorConfig) => RegionTypeColorConfig),
	) => {
		const current = get(highlightColorConfigAtom);
		const currentRegionConfig = {
			exclude: current.exclude,
			page_number: current.page_number,
		} as RegionTypeColorConfig;
		const newConfig =
			typeof update === "function" ? update(currentRegionConfig) : update;
		set(highlightColorConfigAtom, {
			...current,
			...newConfig,
		});
	},
);
