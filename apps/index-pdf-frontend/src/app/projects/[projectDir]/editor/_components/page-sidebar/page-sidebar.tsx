"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DraggableSidebarContainer } from "@pubint/yaboujee/components/draggable-sidebar";
import { useAtom, useAtomValue } from "jotai";
import {
	BookOpen,
	File,
	type LucideIcon,
	Sparkles,
	SquaresSubtract,
	Tags,
	User,
} from "lucide-react";
import type React from "react";
import { useTheme } from "@/app/_common/_providers/theme-provider";
import {
	colorConfigAtom,
	moveWindowToFrontAtom,
	pageAccordionExpandedAtom,
	pageSectionOrderAtom,
	type SectionId,
	sectionsStateAtom,
	updateSectionAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { PageAiContent } from "./components/page-ai-content";
import { PageAuthorContent } from "./components/page-author-content";
import { PagePagesContent } from "./components/page-pages-content";
import { PageRegionsContent } from "./components/page-regions-content";
import { PageScriptureContent } from "./components/page-scripture-content";
import { PageSubjectContent } from "./components/page-subject-content";

export type MentionData = {
	id: string;
	pageNumber: number;
	text: string;
	entryLabel: string;
	entryId: string;
	indexTypes: string[];
	type: "text" | "region";
};

type PageSidebarProps = {
	mentions: MentionData[];
	currentPage: number;
	onMentionClick?: ({ mentionId }: { mentionId: string }) => void;
	enabledIndexTypes: string[]; // Index types enabled for this project
};

/**
 * Page Sidebar Component
 *
 * Right sidebar showing page-level panels (info, indices, etc.)
 */
export const PageSidebar = ({
	mentions,
	currentPage,
	onMentionClick,
	enabledIndexTypes,
}: PageSidebarProps) => {
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";
	const sections = useAtomValue(sectionsStateAtom);
	const colorConfig = useAtomValue(colorConfigAtom);
	const [, updateSection] = useAtom(updateSectionAtom);
	const [, moveToFront] = useAtom(moveWindowToFrontAtom);
	const [expandedItems, setExpandedItems] = useAtom(pageAccordionExpandedAtom);
	const [sectionOrder, setSectionOrder] = useAtom(pageSectionOrderAtom);

	const enabledIndexTypesSet = new Set(enabledIndexTypes);

	const handlePop = ({ id }: { id: SectionId }) => {
		const currentState = sections.get(id);
		// Preserve existing windowState if it exists, otherwise use defaults on right side
		const viewportWidth = window.innerWidth / 16; // rem
		const windowWidth = 25; // rem
		const defaultWindowState = {
			position: { x: viewportWidth - windowWidth - 6.25, y: 6.25 },
			size: { width: 25, height: 18.75 },
			isMaximized: false,
			side: "right" as const,
		};
		updateSection({
			id,
			changes: {
				popped: true,
				windowState: {
					...(currentState?.windowState || defaultWindowState),
					side: "right",
				},
			},
		});
		moveToFront(id);
	};

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		const sourceIndex = result.source.index;
		const destIndex = result.destination.index;

		if (sourceIndex === destIndex) return;

		const newOrder = [...sectionOrder];
		const [movedItem] = newOrder.splice(sourceIndex, 1);
		newOrder.splice(destIndex, 0, movedItem);
		setSectionOrder(newOrder);
	};

	// Filter mentions by current page
	const mentionsOnPage = mentions.filter((m) => m.pageNumber === currentPage);

	// Create filtered mention lists per index type
	const getMentionsForType = (indexType: string) =>
		mentionsOnPage.filter((m) => m.indexTypes.includes(indexType));

	const allSectionMetadata: Partial<
		Record<
			SectionId,
			{
				title: string;
				icon: LucideIcon;
				content: React.ComponentType;
			}
		>
	> = {
		"page-pages": {
			title: "Pages",
			icon: File,
			content: PagePagesContent,
		},
		"page-regions": {
			title: "Regions",
			icon: SquaresSubtract,
			content: () => <PageRegionsContent currentPage={currentPage} />,
		},
		"page-ai": {
			title: "AI",
			icon: Sparkles,
			content: PageAiContent,
		},
		"page-subject": {
			title: "Subject Index",
			icon: Tags,
			content: () => (
				<PageSubjectContent
					mentions={getMentionsForType("subject")}
					onMentionClick={onMentionClick}
				/>
			),
		},
		"page-author": {
			title: "Author Index",
			icon: User,
			content: () => (
				<PageAuthorContent
					mentions={getMentionsForType("author")}
					onMentionClick={onMentionClick}
				/>
			),
		},
		"page-scripture": {
			title: "Scripture Index",
			icon: BookOpen,
			content: () => (
				<PageScriptureContent
					mentions={getMentionsForType("scripture")}
					onMentionClick={onMentionClick}
				/>
			),
		},
	};

	// Filter sections to only include index types enabled for this project
	const sectionMetadata = Object.fromEntries(
		Object.entries(allSectionMetadata).filter(([sectionId]) => {
			// Always include non-index sections (pages, regions, ai)
			if (
				sectionId === "page-pages" ||
				sectionId === "page-regions" ||
				sectionId === "page-ai"
			) {
				return true;
			}
			// For index type sections, check if enabled for project
			const indexType = sectionId.replace("page-", "");
			return enabledIndexTypesSet.has(indexType);
		}),
	) as typeof allSectionMetadata;

	const visibleSections = sectionOrder
		.filter((id) => sections.get(id)?.visible && !sections.get(id)?.popped)
		.reverse();

	return (
		<DraggableSidebarContainer
			visibleSections={visibleSections}
			sectionMetadata={sectionMetadata}
			expandedItems={expandedItems}
			onExpandedChange={setExpandedItems}
			onDragEnd={handleDragEnd}
			onPop={handlePop}
			droppableId="page-sidebar-accordion"
			side="right"
			colorConfig={colorConfig}
			isDarkMode={isDarkMode}
			header="Page"
		/>
	);
};
