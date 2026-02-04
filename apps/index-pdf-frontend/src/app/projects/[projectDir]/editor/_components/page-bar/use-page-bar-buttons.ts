"use client";

import type { StyledToggleButton } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import {
	BookOpen,
	ChevronLeft,
	File,
	Filter,
	type LucideIcon,
	Tag,
	User,
} from "lucide-react";
import {
	pageSectionOrderAtom,
	pageSidebarCollapsedAtom,
	pageSidebarLastVisibleAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";

export const usePageBarButtons = (): {
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
	const [pageSidebarCollapsed, setPageSidebarCollapsed] = useAtom(
		pageSidebarCollapsedAtom,
	);
	const [pageLastVisible, setPageLastVisible] = useAtom(
		pageSidebarLastVisibleAtom,
	);
	const [sectionOrder, setSectionOrder] = useAtom(pageSectionOrderAtom);

	const handleSidebarToggle = () => {
		if (!pageSidebarCollapsed) {
			// Collapsing - remember visible non-popped sections and hide them
			const visibleInSidebar: SectionId[] = [];
			Array.from(sections.entries()).forEach(([id, state]) => {
				if (id.startsWith("page") && state.visible && !state.popped) {
					visibleInSidebar.push(id);
					updateSection({
						id,
						changes: { visible: false },
					});
				}
			});
			setPageLastVisible(visibleInSidebar);
		} else {
			// Expanding - restore previously visible sections if they're not currently popped
			pageLastVisible.forEach((id) => {
				const currentState = sections.get(id);
				if (currentState && !currentState.popped) {
					updateSection({
						id,
						changes: { visible: true },
					});
				}
			});
		}
		setPageSidebarCollapsed(!pageSidebarCollapsed);
	};

	const sectionMetadata: Partial<
		Record<SectionId, { name: string; icon: LucideIcon; tooltip: string }>
	> = {
		"page-pages": {
			name: "pagePages",
			icon: File as LucideIcon,
			tooltip: "Page",
		},
		"page-contexts": {
			name: "pageContexts",
			icon: Filter as LucideIcon,
			tooltip: "Page Contexts",
		},
		"page-author": {
			name: "pageAuthors",
			icon: User as LucideIcon,
			tooltip: "Page Author Index",
		},
		"page-scripture": {
			name: "pageScripture",
			icon: BookOpen as LucideIcon,
			tooltip: "Page Scripture Index",
		},
		"page-subject": {
			name: "pageSubject",
			icon: Tag as LucideIcon,
			tooltip: "Page Subject Index",
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

			return {
				name: meta.name,
				icon: meta.icon,
				isActive: sections.get(sectionId)?.visible || false,
				onClick: () => {
					const current = sections.get(sectionId);
					const newVisible = !current?.visible;

					if (pageSidebarCollapsed) {
						// If sidebar is collapsed, open/close as window
						const viewportWidth = window.innerWidth / 16; // rem
						const windowWidth = 25; // rem
						const defaultWindowState = {
							position: { x: viewportWidth - windowWidth - 6.25, y: 6.25 },
							size: { width: 25, height: 18.75 },
							isMaximized: false,
							side: "right" as const,
						};

						updateSection({
							id: sectionId,
							changes: {
								visible: newVisible,
								popped: newVisible, // Open as window if visible, close if not
								windowState: newVisible
									? {
											...(current?.windowState || defaultWindowState),
											side: "right",
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
		...sectionButtons,
		{
			name: "toggleSidebar",
			icon: ChevronLeft as LucideIcon,
			isActive: !pageSidebarCollapsed,
			onClick: handleSidebarToggle,
			tooltip: pageSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar",
		},
	];

	return { buttons, onReorder };
};
