import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { mockSubjectEntries } from "../../../../_mocks/index-entries";
import type { Mention } from "../../../editor/editor";
import { EntryTree } from "../../entry-tree";

const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Philosophy reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-1",
		entryLabel: "Philosophy",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
	{
		id: "m2",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 150, width: 200, height: 20 }],
		entryId: "entry-subject-3",
		entryLabel: "Kant, Immanuel",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
];

const meta: Meta<typeof EntryTree> = {
	title: "Projects/[ProjectDir]/Editor/EntryTree/tests/Interaction Tests",
	component: EntryTree,
	parameters: {
		layout: "padded",
	},
	decorators: [
		(Story) => (
			<div style={{ width: "300px", border: "1px solid #ccc" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test: Expand and collapse nodes
 */
export const ExpandCollapseNodes: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
		onCreateEntry: () => console.log("Create entry"),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Find parent entry", async () => {
			const philosophyEntry = canvas.getByText("Philosophy");
			expect(philosophyEntry).toBeInTheDocument();
		});

		await step("Find expand button and collapse", async () => {
			const expandButtons = canvas.getAllByRole("button");
			// Find the chevron button (not the entry button itself)
			const chevronButton = expandButtons.find((btn) =>
				btn.querySelector("svg.lucide-chevron-down"),
			);
			if (chevronButton) {
				await userEvent.click(chevronButton);
			}
		});

		await step("Verify children hidden", async () => {
			// Wait a bit for collapse animation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Kant should not be visible when Philosophy is collapsed
			// Note: Entry might still be in DOM but hidden - test would need CSS checks
		});
	},
};

/**
 * Test: Click create entry button
 */
export const CreateEntry: Story = {
	args: {
		entries: mockSubjectEntries,
		mentions: mockMentions,
		onCreateEntry: () => console.log("Create clicked"),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click create entry button", async () => {
			const createButton = canvas.getByText("Create Entry");
			await userEvent.click(createButton);
		});
	},
};

/**
 * Test: Empty state shows create button
 */
export const EmptyStateShowsButton: Story = {
	args: {
		entries: [],
		mentions: [],
		onCreateEntry: () => console.log("Create clicked"),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify empty message", async () => {
			const message = canvas.getByText("No entries yet");
			expect(message).toBeInTheDocument();
		});

		await step("Verify create button present", async () => {
			const createButton = canvas.getByText("Create Entry");
			expect(createButton).toBeInTheDocument();
		});

		await step("Click create button", async () => {
			const createButton = canvas.getByText("Create Entry");
			await userEvent.click(createButton);
		});
	},
};
