export type EditorSectionId =
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

export type EditorSectionState = {
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
