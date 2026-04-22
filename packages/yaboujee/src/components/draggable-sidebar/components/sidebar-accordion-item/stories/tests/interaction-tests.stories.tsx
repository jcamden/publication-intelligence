import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import { Accordion } from "@pubint/yabasic/components/ui/accordion";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, within } from "storybook/test";
import { SidebarAccordionItem } from "../../sidebar-accordion-item";
import {
	clickDragHandle,
	clickPopOutButton,
	clickTestSectionTrigger,
	dragHandleIsButtonAndVisible,
	expandedCountShows,
	expandedStateShows,
	popOutButtonAccessibleName,
} from "../helpers/steps";
import {
	defaultSidebarAccordionItemArgs,
	mockDragHandleProps,
	sampleContent,
} from "../shared";

const meta: Meta<typeof SidebarAccordionItem> = {
	...defaultInteractionTestMeta,
	title:
		"Components/DraggableSidebar/SidebarAccordionItem/tests/Interaction Tests",
	component: SidebarAccordionItem,
	parameters: {
		layout: "padded",
	},
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
		const isExpanded = expanded.includes("test-section");
		const toggleExpanded = () => {
			setExpanded((prev) =>
				prev.includes("test-section")
					? prev.filter((v) => v !== "test-section")
					: [...prev, "test-section"],
			);
		};

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					onPop={handlePop}
					dragHandleProps={mockDragHandleProps}
					isExpanded={isExpanded}
					onToggle={toggleExpanded}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await clickPopOutButton({ canvas, user, step });
		await popOutButtonAccessibleName({ canvas, step });
	},
};

/**
 * Test accordion trigger expand/collapse
 */
export const AccordionTrigger: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>([]);
		const isExpanded = expanded.includes("test-section");
		const toggleExpanded = () => {
			setExpanded((prev) =>
				prev.includes("test-section")
					? prev.filter((v) => v !== "test-section")
					: [...prev, "test-section"],
			);
		};

		return (
			<div>
				<Accordion value={expanded} onValueChange={setExpanded}>
					<SidebarAccordionItem
						{...defaultSidebarAccordionItemArgs}
						dragHandleProps={mockDragHandleProps}
						isExpanded={isExpanded}
						onToggle={toggleExpanded}
					>
						<div data-testid="content">{sampleContent()}</div>
					</SidebarAccordionItem>
				</Accordion>
				<div data-testid="expanded-count">{expanded.length}</div>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await expandedCountShows({ canvas, expected: "0", step });
		await clickTestSectionTrigger({ canvas, user, step });
		await expandedCountShows({ canvas, expected: "1", step });
	},
};

/**
 * Test drag handle presence
 */
export const DragHandlePresence: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>(["test-section"]);
		const isExpanded = expanded.includes("test-section");
		const toggleExpanded = () => {
			setExpanded((prev) =>
				prev.includes("test-section")
					? prev.filter((v) => v !== "test-section")
					: [...prev, "test-section"],
			);
		};

		return (
			<Accordion value={expanded} onValueChange={setExpanded}>
				<SidebarAccordionItem
					{...defaultSidebarAccordionItemArgs}
					dragHandleProps={mockDragHandleProps}
					isExpanded={isExpanded}
					onToggle={toggleExpanded}
				>
					{sampleContent()}
				</SidebarAccordionItem>
			</Accordion>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await dragHandleIsButtonAndVisible({ canvas, step });
	},
};

/**
 * Test stop propagation on drag handle
 */
export const DragHandleStopPropagation: Story = {
	render: () => {
		const [expanded, setExpanded] = useState<string[]>([]);
		const isExpanded = expanded.includes("test-section");
		const toggleExpanded = () => {
			setExpanded((prev) =>
				prev.includes("test-section")
					? prev.filter((v) => v !== "test-section")
					: [...prev, "test-section"],
			);
		};

		return (
			<div>
				<Accordion value={expanded} onValueChange={setExpanded}>
					<SidebarAccordionItem
						{...defaultSidebarAccordionItemArgs}
						dragHandleProps={mockDragHandleProps}
						isExpanded={isExpanded}
						onToggle={toggleExpanded}
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await expandedStateShows({ canvas, expected: "collapsed", step });
		await clickDragHandle({ canvas, user, step });
		await expandedStateShows({ canvas, expected: "collapsed", step });
	},
};
