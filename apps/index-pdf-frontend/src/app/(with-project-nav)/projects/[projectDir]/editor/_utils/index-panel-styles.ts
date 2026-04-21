/**
 * Shared styling for index panels (project sidebar and page sidebar).
 * Ensures consistent background and border colors across subject, author, and scripture index types.
 */

/** Tailwind classes for the scroll area container in index panels.
 * Uses h-[32rem] so the ScrollArea Root has a defined height; without it, the Root
 * sizes to content and the Viewport (size-full) never gets overflow, so it won't scroll.
 */
export const INDEX_PANEL_SCROLL_AREA_CLASS =
	"h-[32rem] p-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900";
