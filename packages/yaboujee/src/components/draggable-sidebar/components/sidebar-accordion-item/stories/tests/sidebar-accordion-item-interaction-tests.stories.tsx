import { Accordion } from "@pubint/yabasic/components/ui/accordion";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { SidebarAccordionItem } from "../../sidebar-accordion-item";
import {
	defaultSidebarAccordionItemArgs,
	mockDragHandleProps,
	sampleContent,
} from "../shared";

const meta: Meta<typeof SidebarAccordionItem> = {
	title:
		"Components/DraggableSidebar/SidebarAccordionItem/tests/Interaction Tests",
	component: SidebarAccordionItem,
	parameters: {
		layout: "padded",
	},
	tags: ["test:interaction"],
	decorators: [
		(Story) => (
			<div style={{ width: "300px", border: "1px solid #ddd" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test pop button click
 */
export const PopButtonClick: Story = {
	render: () => {
		const handlePop = fn();
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					onPop={handlePop}
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const popButton = canvas.getByLabelText("Pop out to window");

		await userEvent.click(popButton);
		await expect(popButton).toHaveAccessibleName("Pop out to window");
	},
};

/**
 * Test accordion trigger expand/collapse
 */
export const AccordionTrigger: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>([]);

		return (
			<div>
				<Accordion value={expanded} onValueChange={setExpanded}>
					<SidebarAccordionItem
						{...defaultSidebarAccordionItemArgs}
						dragHandleProps={mockDragHandleProps}
					>
						<div data-testid="content">{sampleContent()}</div>
					</SidebarAccordionItem>
				</Accordion>
				<div data-testid="expanded-count">{expanded.length}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const expandedCount = canvas.getByTestId("expanded-count");

		await expect(expandedCount).toHaveTextContent("0");

		const trigger = canvas.getByRole("button", { name: /test section/i });
		await userEvent.click(trigger);

		await expect(expandedCount).toHaveTextContent("1");
	},
};

/**
 * Test drag handle presence
 */
export const DragHandlePresence: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					dragHandleProps={mockDragHandleProps}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const dragHandle = canvas.getByLabelText("Drag to reorder");

		await expect(dragHandle).toBeVisible();
		await expect(dragHandle).toHaveAttribute("role", "button");
	},
};

/**
 * Test stop propagation on drag handle
 */
export const DragHandleStopPropagation: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>([]);

		return (
			<div>
				<Accordion value={expanded} onValueChange={setExpanded}>
					<SidebarAccordionItem
						{...defaultSidebarAccordionItemArgs}
						dragHandleProps={mockDragHandleProps}
					>
						{sampleContent()}
					</SidebarAccordionItem>
				</Accordion>
				<div data-testid="expanded-state">
					{expanded.includes("test-section") ? "expanded" : "collapsed"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const expandedState = canvas.getByTestId("expanded-state");

		await expect(expandedState).toHaveTextContent("collapsed");

		const dragHandle = canvas.getByLabelText("Drag to reorder");
		await userEvent.click(dragHandle);

		await expect(expandedState).toHaveTextContent("collapsed");
	},
};
