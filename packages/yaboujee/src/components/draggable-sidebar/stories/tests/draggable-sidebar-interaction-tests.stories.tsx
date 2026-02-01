import type { DropResult } from "@hello-pangea/dnd";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { FileText, Tag, User } from "lucide-react";
import { useState } from "react";
import { DraggableSidebar } from "../../draggable-sidebar";

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
	title: "Components/DraggableSidebar/tests/Interaction Tests",
	component: DraggableSidebar,
	parameters: {
		layout: "padded",
	},
	tags: ["test:interaction"],
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const expandedCount = canvas.getByTestId("expanded-count");

		await expect(expandedCount).toHaveTextContent("0");

		const pagesButton = canvas.getByRole("button", { name: /pages/i });
		await userEvent.click(pagesButton);

		await expect(expandedCount).toHaveTextContent("1");
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const popButtons = canvas.getAllByLabelText("Pop out to window");

		await expect(popButtons.length).toBeGreaterThan(0);

		await userEvent.click(popButtons[0]);
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const expandedCount = canvas.getByTestId("expanded-count");

		await expect(expandedCount).toHaveTextContent("0");

		// Click accordion triggers by finding the text and clicking its parent button
		const pagesText = canvas.getByText("Pages");
		const pagesButton = pagesText.closest("button");
		if (!pagesButton) throw new Error("Pages button not found");
		await userEvent.click(pagesButton);

		await waitFor(() => expect(expandedCount).toHaveTextContent("1"));

		const tagsText = canvas.getByText("Tags");
		const tagsButton = tagsText.closest("button");
		if (!tagsButton) throw new Error("Tags button not found");
		await userEvent.click(tagsButton);

		await waitFor(() => expect(expandedCount).toHaveTextContent("2"));

		const authorText = canvas.getByText("Author");
		const authorButton = authorText.closest("button");
		if (!authorButton) throw new Error("Author button not found");
		await userEvent.click(authorButton);

		await waitFor(() => expect(expandedCount).toHaveTextContent("3"));
	},
};
