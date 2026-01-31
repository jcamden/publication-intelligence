"use client";

import type { ToggleButton } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import {
	Book,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Filter,
	Info,
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
} from "@/atoms/editor-atoms";

export const usePageBarButtons = (): {
	buttons: ToggleButton[];
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
		"page-info": {
			name: "pageInfo",
			icon: Info as LucideIcon,
			tooltip: "Page Info",
		},
		"page-contexts": {
			name: "pageContexts",
			icon: Filter as LucideIcon,
			tooltip: "Page Contexts",
		},
		"page-biblio": {
			name: "pageBiblio",
			icon: Book as LucideIcon,
			tooltip: "Page Bibliography",
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

	const sectionButtons: ToggleButton[] = sectionOrder
		.map((sectionId) => {
			const meta = sectionMetadata[sectionId];
			if (!meta) return null;

			return {
				name: meta.name,
				icon: meta.icon,
				isActive: sections.get(sectionId)?.visible || false,
				onClick: () => {
					const current = sections.get(sectionId);
					updateSection({
						id: sectionId,
						changes: { visible: !current?.visible },
					});
				},
				tooltip: meta.tooltip,
			} as ToggleButton;
		})
		.filter((button): button is ToggleButton => button !== null);

	const buttons: ToggleButton[] = [
		...sectionButtons,
		{
			name: "toggleSidebar",
			icon: (pageSidebarCollapsed ? ChevronLeft : ChevronRight) as LucideIcon,
			isActive: false,
			onClick: handleSidebarToggle,
			tooltip: pageSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar",
		},
	];

	return { buttons, onReorder };
};
