import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Section IDs
export type SectionId =
	| "project-pages"
	| "project-subject"
	| "project-author"
	| "project-scripture"
	| "project-biblio"
	| "project-contexts"
	| "page-info"
	| "page-subject"
	| "page-author"
	| "page-scripture"
	| "page-biblio"
	| "page-contexts";

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
	};
};

// Initial state with subject indices visible by default
const initialSections = new Map<SectionId, SectionState>([
	["project-pages", { visible: false, popped: false }],
	["project-subject", { visible: true, popped: false }], // visible by default
	["project-author", { visible: false, popped: false }],
	["project-scripture", { visible: false, popped: false }],
	["project-biblio", { visible: false, popped: false }],
	["project-contexts", { visible: false, popped: false }],
	["page-info", { visible: false, popped: false }],
	["page-subject", { visible: true, popped: false }], // visible by default
	["page-author", { visible: false, popped: false }],
	["page-scripture", { visible: false, popped: false }],
	["page-biblio", { visible: false, popped: false }],
	["page-contexts", { visible: false, popped: false }],
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
				return new Map(Object.entries(parsed)) as Map<SectionId, SectionState>;
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
);
export const pageSidebarLastVisibleAtom = atomWithStorage<SectionId[]>(
	"page-sidebar-last-visible",
	[],
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
	"project-contexts",
	"project-biblio",
	"project-author",
	"project-scripture",
	"project-subject",
];
const defaultPageOrder: SectionId[] = [
	"page-info",
	"page-contexts",
	"page-biblio",
	"page-author",
	"page-scripture",
	"page-subject",
];

export const projectSectionOrderAtom = atomWithStorage<SectionId[]>(
	"project-section-order",
	defaultProjectOrder,
);
export const pageSectionOrderAtom = atomWithStorage<SectionId[]>(
	"page-section-order",
	defaultPageOrder,
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

// PDF viewer state atoms
export const currentPageAtom = atom(1);
export const totalPagesAtom = atom(0);
export const zoomAtom = atom(1.7);
