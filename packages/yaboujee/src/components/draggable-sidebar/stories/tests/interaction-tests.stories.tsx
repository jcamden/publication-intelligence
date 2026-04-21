import type { DropResult } from "@hello-pangea/dnd";
import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { FileText, Tag, User } from "lucide-react";
import { useState } from "react";
import { DraggableSidebar } from "../../draggable-sidebar";
import {
	clickAccordionTriggersForLabels,
	clickFirstPopOutButton,
	clickPagesAccordionTrigger,
	expandedCountShows,
	popOutButtonsExist,
} from "../helpers/steps";

const PagesContent = () => <div style={{ padding: "12px" }}>Pages content</div>;
const TagsContent = () => <div style={{ padding: "12px" }}>Tags content</div>;
const AuthorContent = () => (
	<div style={{ padding: "12px" }}>Author content</div>
);

const sectionMetadata = {
	pages: { title: "Pages", icon: FileText, content: PagesContent },
	tags: { title: "Tags", icon: Tag, content: TagsContent },
	author: { title: "Author", icon: User, content: AuthorContent },
};

const meta: Meta<typeof DraggableSidebar> = {
	...defaultInteractionTestMeta,
	title: "Components/DraggableSidebar/tests/Interaction Tests",
	component: DraggableSidebar,
	parameters: {
		layout: "padded",
	},
	decorators: [
		(Story) => (
			<div
				style={{ height: "600px", width: "350px", border: "1px solid #ddd" }}
			>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test accordion expand/collapse
 */
export const AccordionExpandCollapse: Story = {
	render: () => {
		const [visibleSections] = useState<string[]>(["pages", "tags"]);
		const [expandedItems, setExpandedItems] = useState<string[]>([]);

		const handleDragEnd = (_result: DropResult) => {};

		return (
			<div>
				<DraggableSidebar
					visibleSections={visibleSections}
					sectionMetadata={sectionMetadata}
					expandedItems={expandedItems}
					onExpandedChange={setExpandedItems}
					onDragEnd={handleDragEnd}
					onPop={({ id }) => console.log(id)}
					droppableId="test-sidebar"
					side="left"
				/>
				<div data-testid="expanded-count">{expandedItems.length}</div>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await expandedCountShows({ canvas, expected: "0", step });
		await clickPagesAccordionTrigger({ canvas, user, step });
		await expandedCountShows({ canvas, expected: "1", step });
	},
};

/**
 * Test pop button actions
 */
export const PopButtonActions: Story = {
	render: () => {
		const [visibleSections] = useState<string[]>(["pages", "tags"]);
		const [expandedItems, setExpandedItems] = useState<string[]>(["pages"]);

		const handleDragEnd = (_result: DropResult) => {};

		return (
			<DraggableSidebar
				visibleSections={visibleSections}
				sectionMetadata={sectionMetadata}
				expandedItems={expandedItems}
				onExpandedChange={setExpandedItems}
				onDragEnd={handleDragEnd}
				onPop={({ id }) => console.log(`Popped: ${id}`)}
				droppableId="pop-test-sidebar"
				side="left"
			/>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await popOutButtonsExist({ canvas, step });
		await clickFirstPopOutButton({ canvas, user, step });
	},
};

/**
 * Test multiple section toggle
 */
export const MultipleSectionToggle: Story = {
	render: () => {
		const [visibleSections] = useState<string[]>(["pages", "tags", "author"]);
		const [expandedItems, setExpandedItems] = useState<string[]>([]);

		const handleDragEnd = (_result: DropResult) => {};

		return (
			<div>
				<DraggableSidebar
					visibleSections={visibleSections}
					sectionMetadata={sectionMetadata}
					expandedItems={expandedItems}
					onExpandedChange={setExpandedItems}
					onDragEnd={handleDragEnd}
					onPop={({ id }) => console.log(id)}
					droppableId="multi-test-sidebar"
					side="left"
				/>
				<div data-testid="expanded-count">{expandedItems.length}</div>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await expandedCountShows({ canvas, expected: "0", step });
		await clickAccordionTriggersForLabels({
			canvas,
			user,
			labels: ["Pages", "Tags", "Author"],
			step,
		});
	},
};
