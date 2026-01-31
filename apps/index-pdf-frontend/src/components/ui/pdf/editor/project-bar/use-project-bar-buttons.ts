"use client";

import type { ToggleButton } from "@pubint/yaboujee";
import { useAtom, useAtomValue } from "jotai";
import {
	Book,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	File,
	Filter,
	type LucideIcon,
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
} from "@/atoms/editor-atoms";

export const useProjectBarButtons = (): {
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
	const [projectSidebarCollapsed, setProjectSidebarCollapsed] = useAtom(
		projectSidebarCollapsedAtom,
	);
	const [projectLastVisible, setProjectLastVisible] = useAtom(
		projectSidebarLastVisibleAtom,
	);
	const [sectionOrder, setSectionOrder] = useAtom(projectSectionOrderAtom);

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
		"project-contexts": {
			name: "projectContexts",
			icon: Filter as LucideIcon,
			tooltip: "Project Contexts",
		},
		"project-biblio": {
			name: "projectBiblio",
			icon: Book as LucideIcon,
			tooltip: "Project Bibliography",
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
		{
			name: "toggleSidebar",
			icon: (projectSidebarCollapsed
				? ChevronRight
				: ChevronLeft) as LucideIcon,
			isActive: false,
			onClick: handleSidebarToggle,
			tooltip: projectSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar",
		},
		...sectionButtons,
	];

	return { buttons, onReorder };
};
