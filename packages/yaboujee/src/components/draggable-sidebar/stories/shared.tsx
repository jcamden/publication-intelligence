import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { fn } from "@storybook/test";
import { FileText, Tag } from "lucide-react";
import type { ReactNode } from "react";

export const SIDEBAR_ACCORDION_ITEM_TEST_IDS = {
	item: "sidebar-accordion-item",
	dragHandle: "drag-handle",
	popButton: "pop-button",
	trigger: "accordion-trigger",
} as const;

export const defaultSidebarAccordionItemArgs = {
	value: "test-section",
	title: "Test Section",
	icon: FileText,
	onPop: fn() as () => void,
	index: 0,
	side: "left" as const,
};

export const mockDragHandleProps: DraggableProvidedDragHandleProps = {
	"data-rfd-drag-handle-draggable-id": "test",
	"data-rfd-drag-handle-context-id": "test",
	"aria-describedby": "test",
	role: "button",
	tabIndex: 0,
	draggable: false,
	// biome-ignore lint/suspicious/noExplicitAny: event type from @hello-pangea/dnd
	onDragStart: fn() as (event: any) => void,
};

export const sampleContent = (): ReactNode => {
	return (
		<div style={{ padding: "12px" }}>
			<p>Sample accordion content</p>
			<p>This is the content inside the accordion item.</p>
		</div>
	);
};

export const sampleIcons = {
	pages: FileText,
	tags: Tag,
};
