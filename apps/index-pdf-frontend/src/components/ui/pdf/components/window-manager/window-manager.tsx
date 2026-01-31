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
} from "@/atoms/editor-atoms";
import { PageAuthorContent } from "../page-sidebar/components/page-author-content";
import { PageBiblioContent } from "../page-sidebar/components/page-biblio-content";
import { PageContextsContent } from "../page-sidebar/components/page-contexts-content";
import { PageInfoContent } from "../page-sidebar/components/page-info-content";
import { PageScriptureContent } from "../page-sidebar/components/page-scripture-content";
import { PageSubjectContent } from "../page-sidebar/components/page-subject-content";
import { ProjectAuthorContent } from "../project-sidebar/components/project-author-content";
import { ProjectBiblioContent } from "../project-sidebar/components/project-biblio-content";
import { ProjectContextsContent } from "../project-sidebar/components/project-contexts-content";
import { ProjectPagesContent } from "../project-sidebar/components/project-pages-content";
import { ProjectScriptureContent } from "../project-sidebar/components/project-scripture-content";
import { ProjectSubjectContent } from "../project-sidebar/components/project-subject-content";

const windowRegistry: Record<
	SectionId,
	{
		title: string;
		component: ComponentType;
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
	"project-contexts": {
		title: "Project Contexts",
		component: ProjectContextsContent,
	},
	"page-info": { title: "Page Info", component: PageInfoContent },
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
	"page-contexts": { title: "Page Contexts", component: PageContextsContent },
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

export const WindowManager = () => {
	const windowsToRender = useAtomValue(windowsToRenderAtom);
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const orderedWindows = useAtomValue(orderedWindowsAtom);
	const projectCollapsed = useAtomValue(projectSidebarCollapsedAtom);
	const pageCollapsed = useAtomValue(pageSidebarCollapsedAtom);

	return (
		<>
			{windowsToRender.map(({ id, state }) => {
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
						<Content />
					</Window>
				);
			})}
		</>
	);
};
