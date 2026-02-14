"use client";

import type { StyledToggleButton } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import {
	BookOpen,
	ChevronRight,
	File,
	type LucideIcon,
	Sparkles,
	SquaresSubtract,
	Tag,
	User,
} from "lucide-react";
import {
	projectSectionOrderAtom,
	projectSidebarCollapsedAtom,
	projectSidebarLastVisibleAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";

export const useProjectBarButtons = ({
	enabledIndexTypes,
}: {
	enabledIndexTypes: string[];
}): {
	buttons: StyledToggleButton[];
	onReorder: ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => void;
} => {
	const sections = useAtomValue(sectionsStateAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [projectSidebarCollapsed, setProjectSidebarCollapsed] = useAtom(
		projectSidebarCollapsedAtom,
	);
	const [projectLastVisible, setProjectLastVisible] = useAtom(
		projectSidebarLastVisibleAtom,
	);
	const [sectionOrder, setSectionOrder] = useAtom(projectSectionOrderAtom);

	const enabledIndexTypesSet = new Set(enabledIndexTypes);

	const handleSidebarToggle = () => {
		if (!projectSidebarCollapsed) {
			// Collapsing - remember visible non-popped sections and hide them
			const visibleInSidebar: SectionId[] = [];
			Array.from(sections.entries()).forEach(([id, state]) => {
				if (id.startsWith("project") && state.visible && !state.popped) {
					visibleInSidebar.push(id);
					updateSection({
						id,
						changes: { visible: false },
					});
				}
			});
			setProjectLastVisible(visibleInSidebar);
		} else {
			// Expanding - restore previously visible sections if they're not currently popped
			projectLastVisible.forEach((id) => {
				const currentState = sections.get(id);
				if (currentState && !currentState.popped) {
					updateSection({
						id,
						changes: { visible: true },
					});
				}
			});
		}
		setProjectSidebarCollapsed(!projectSidebarCollapsed);
	};

	const sectionMetadata: Partial<
		Record<SectionId, { name: string; icon: LucideIcon; tooltip: string }>
	> = {
		"project-pages": {
			name: "projectPages",
			icon: File as LucideIcon,
			tooltip: "Project Pages",
		},
		"project-regions": {
			name: "projectRegions",
			icon: SquaresSubtract as LucideIcon,
			tooltip: "Project Regions",
		},
		"project-ai": {
			name: "projectAi",
			icon: Sparkles as LucideIcon,
			tooltip: "AI",
		},
		"project-author": {
			name: "projectAuthors",
			icon: User as LucideIcon,
			tooltip: "Project Author Index",
		},
		"project-scripture": {
			name: "projectScripture",
			icon: BookOpen as LucideIcon,
			tooltip: "Project Scripture Index",
		},
		"project-subject": {
			name: "projectSubject",
			icon: Tag as LucideIcon,
			tooltip: "Project Subject Index",
		},
	} as const;

	const onReorder = ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => {
		const newOrder = [...sectionOrder];
		const [movedItem] = newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, movedItem);
		setSectionOrder(newOrder);
	};

	const sectionButtons: StyledToggleButton[] = sectionOrder
		.map((sectionId) => {
			const meta = sectionMetadata[sectionId];
			if (!meta) return null;

			// Filter out index type sections that aren't enabled for this project
			if (
				sectionId !== "project-pages" &&
				sectionId !== "project-regions" &&
				sectionId !== "project-ai"
			) {
				const indexType = sectionId.replace("project-", "");
				if (!enabledIndexTypesSet.has(indexType)) {
					return null;
				}
			}

			return {
				name: meta.name,
				icon: meta.icon,
				isActive: sections.get(sectionId)?.visible || false,
				onClick: () => {
					const current = sections.get(sectionId);
					const newVisible = !current?.visible;

					if (projectSidebarCollapsed) {
						// If sidebar is collapsed, open/close as window
						const defaultWindowState = {
							position: { x: 6.25, y: 6.25 },
							size: { width: 25, height: 18.75 },
							isMaximized: false,
							side: "left" as const,
						};

						updateSection({
							id: sectionId,
							changes: {
								visible: newVisible,
								popped: newVisible, // Open as window if visible, close if not
								windowState: newVisible
									? {
											...(current?.windowState || defaultWindowState),
											side: "left",
										}
									: current?.windowState,
							},
						});
					} else {
						// If sidebar is expanded, just toggle visibility in sidebar
						updateSection({
							id: sectionId,
							changes: { visible: newVisible },
						});
					}
				},
				tooltip: meta.tooltip,
			} as StyledToggleButton;
		})
		.filter((button): button is StyledToggleButton => button !== null);

	const buttons: StyledToggleButton[] = [
		{
			name: "toggleSidebar",
			icon: ChevronRight as LucideIcon,
			isActive: !projectSidebarCollapsed,
			onClick: handleSidebarToggle,
			tooltip: projectSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar",
		},
		...sectionButtons,
	];

	return { buttons, onReorder };
};
