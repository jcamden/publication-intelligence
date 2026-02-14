"use client";

import { Window } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import type { ComponentType } from "react";
import {
	moveWindowToFrontAtom,
	orderedWindowsAtom,
	pageSidebarCollapsedAtom,
	projectSidebarCollapsedAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
	windowsToRenderAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { PageAiContent } from "../page-sidebar/components/page-ai-content";
import { PageAuthorContent } from "../page-sidebar/components/page-author-content";
import { PageBiblioContent } from "../page-sidebar/components/page-biblio-content";
import { PageInfoContent } from "../page-sidebar/components/page-info-content";
import { PagePagesContent } from "../page-sidebar/components/page-pages-content";
import { PageRegionsContent } from "../page-sidebar/components/page-regions-content";
import { PageScriptureContent } from "../page-sidebar/components/page-scripture-content";
import { PageSubjectContent } from "../page-sidebar/components/page-subject-content";
import { ProjectAiContent } from "../project-sidebar/components/project-ai-content";
import { ProjectAuthorContent } from "../project-sidebar/components/project-author-content";
import { ProjectBiblioContent } from "../project-sidebar/components/project-biblio-content";
import { ProjectPagesContent } from "../project-sidebar/components/project-pages-content";
import { ProjectRegionsContent } from "../project-sidebar/components/project-regions-content";
import { ProjectScriptureContent } from "../project-sidebar/components/project-scripture-content";
import { ProjectSubjectContent } from "../project-sidebar/components/project-subject-content";

type Mention = {
	id: string;
	pageNumber: number;
	text: string;
	entryLabel: string;
	entryId: string;
	indexTypes: string[];
	type: "text" | "region";
};

type WindowManagerProps = {
	activeAction: { type: string | null; indexType: string | null };
	onSelectText: ({ indexType }: { indexType: string }) => void;
	onDrawRegion: ({ indexType }: { indexType: string }) => void;
	onEditRegion?: (regionId: string) => void;
	mentions: Mention[];
	currentPage: number;
	onMentionClick: ({ mentionId }: { mentionId: string }) => void;
	enabledIndexTypes: string[]; // Index types enabled for this project
};

const windowRegistry: Record<
	SectionId,
	{
		title: string;
		// biome-ignore lint/suspicious/noExplicitAny: Window registry needs to support components with varying prop types
		component: ComponentType<any>;
	}
> = {
	"project-pages": { title: "Project Pages", component: ProjectPagesContent },
	"project-subject": {
		title: "Project Subject Index",
		component: ProjectSubjectContent,
	},
	"project-author": {
		title: "Project Author Index",
		component: ProjectAuthorContent,
	},
	"project-scripture": {
		title: "Project Scripture Index",
		component: ProjectScriptureContent,
	},
	"project-biblio": {
		title: "Project Bibliography",
		component: ProjectBiblioContent,
	},
	"project-regions": {
		title: "Project Regions",
		component: ProjectRegionsContent,
	},
	"project-ai": {
		title: "AI",
		component: ProjectAiContent,
	},
	"page-info": { title: "Page Info", component: PageInfoContent },
	"page-pages": { title: "Page Pages", component: PagePagesContent },
	"page-subject": {
		title: "Page Subject Index",
		component: PageSubjectContent,
	},
	"page-author": { title: "Page Author Index", component: PageAuthorContent },
	"page-scripture": {
		title: "Page Scripture Index",
		component: PageScriptureContent,
	},
	"page-biblio": { title: "Page Bibliography", component: PageBiblioContent },
	"page-regions": { title: "Page Regions", component: PageRegionsContent },
	"page-ai": { title: "AI", component: PageAiContent },
};

const DEFAULT_WINDOW_SIZE = { width: 25, height: 18.75 }; // rem
const getDefaultWindowPosition = ({ sectionId }: { sectionId: SectionId }) => {
	// Project sections pop up on the left, page sections on the right
	if (sectionId.startsWith("project")) {
		return { x: 6.25, y: 6.25 }; // left side
	} else {
		// Calculate position on the right side
		const viewportWidth = window.innerWidth / 16; // rem
		const windowWidth = DEFAULT_WINDOW_SIZE.width;
		return { x: viewportWidth - windowWidth - 6.25, y: 6.25 }; // right side
	}
};

export const WindowManager = ({
	activeAction,
	onSelectText,
	onDrawRegion,
	onEditRegion,
	mentions,
	currentPage,
	onMentionClick,
	enabledIndexTypes,
}: WindowManagerProps) => {
	const windowsToRender = useAtomValue(windowsToRenderAtom);
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const orderedWindows = useAtomValue(orderedWindowsAtom);
	const projectCollapsed = useAtomValue(projectSidebarCollapsedAtom);
	const pageCollapsed = useAtomValue(pageSidebarCollapsedAtom);

	const enabledIndexTypesSet = new Set(enabledIndexTypes);

	// Filter windows to only include enabled index types for this project
	const filteredWindows = windowsToRender.filter(({ id }) => {
		// Always include non-index sections (pages, regions, info, ai)
		if (
			id.includes("-pages") ||
			id.includes("-regions") ||
			id.includes("-info") ||
			id.includes("-ai")
		) {
			return true;
		}
		// For index type sections, check if enabled for project
		const indexType = id.replace(/^(project|page)-/, "");
		return enabledIndexTypesSet.has(indexType);
	});

	return (
		<>
			{filteredWindows.map(({ id, state }) => {
				const config = windowRegistry[id];
				const sidebarCollapsed = id.startsWith("project")
					? projectCollapsed
					: pageCollapsed;

				const zIndex = 1000 + orderedWindows.indexOf(id) * 100;

				const windowState = state.windowState || {
					position: getDefaultWindowPosition({ sectionId: id }),
					size: DEFAULT_WINDOW_SIZE,
					isMaximized: false,
				};

				const Content = config.component;

				// Determine if this section needs action props
				const needsActionProps = [
					"page-subject",
					"page-author",
					"page-scripture",
				].includes(id);

				// Special case for project-regions
				const isProjectRegionsWindow = id === "project-regions";

				const contentProps = needsActionProps
					? {
							activeAction,
							onSelectText,
							onDrawRegion,
							mentions,
							currentPage,
							onMentionClick,
						}
					: isProjectRegionsWindow
						? { activeAction, onDrawRegion, onEditRegion }
						: {};

				return (
					<Window
						key={id}
						id={id}
						title={config.title}
						zIndex={zIndex}
						isMaximized={windowState.isMaximized}
						sidebarCollapsed={sidebarCollapsed}
						position={windowState.position}
						size={windowState.size}
						side={windowState.side}
						onUnpop={() =>
							updateSection({
								id,
								changes: { popped: false },
							})
						}
						onClose={() =>
							updateSection({
								id,
								changes: { visible: false, popped: false },
							})
						}
						onMaximize={() => {
							const newIsMaximized = !windowState.isMaximized;
							if (newIsMaximized) {
								// Maximizing - save current position and size
								updateSection({
									id,
									changes: {
										windowState: {
											...windowState,
											isMaximized: true,
											lastRestorePosition: windowState.position,
											lastRestoreSize: windowState.size,
											position: { x: 0, y: 0 },
											size: {
												width: window.innerWidth / 16,
												height: window.innerHeight / 16,
											},
											side: windowState.side,
										},
									},
								});
							} else {
								// Unmaximizing - restore saved position and size
								updateSection({
									id,
									changes: {
										windowState: {
											...windowState,
											isMaximized: false,
											position:
												windowState.lastRestorePosition || windowState.position,
											size: windowState.lastRestoreSize || windowState.size,
											side: windowState.side,
										},
									},
								});
							}
						}}
						onPositionChange={(position) => {
							if (!windowState.isMaximized) {
								const currentSection = sections.get(id);
								updateSection({
									id,
									changes: {
										windowState: {
											position,
											size:
												currentSection?.windowState?.size || windowState.size,
											isMaximized: false,
											side: windowState.side,
										},
									},
								});
							}
						}}
						onSizeChange={(size) => {
							if (!windowState.isMaximized) {
								const currentSection = sections.get(id);
								updateSection({
									id,
									changes: {
										windowState: {
											position:
												currentSection?.windowState?.position ||
												windowState.position,
											size,
											isMaximized: false,
											side: windowState.side,
										},
									},
								});
							}
						}}
						onResizeStop={({ position, size }) => {
							if (!windowState.isMaximized) {
								const currentSection = sections.get(id);
								updateSection({
									id,
									changes: {
										windowState: {
											...currentSection?.windowState,
											position,
											size,
											isMaximized: false,
											side: windowState.side,
										},
									},
								});
							}
						}}
						onFocus={() => moveToFront(id)}
					>
						<Content {...contentProps} />
					</Window>
				);
			})}
		</>
	);
};
