import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { mockIndexEntries } from "../../../../_mocks/index-entries";
import type { Mention } from "../../../editor/editor";
import { EntryPicker } from "../../entry-picker";

const mockMentions: Mention[] = [
	{
		id: "m1",
		pageNumber: 1,
		text: "Kant reference",
		bboxes: [{ x: 100, y: 100, width: 200, height: 20 }],
		entryId: "entry-subject-3",
		entryLabel: "Kant, Immanuel",
		indexTypes: ["subject"],
		type: "text",
		createdAt: new Date(),
	},
];

const meta: Meta<typeof EntryPicker> = {
	title: "Projects/[ProjectDir]/Editor/EntryPicker/tests/Interaction Tests",
	component: EntryPicker,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div style={{ width: "400px" }}>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test: Search entries by label
 */
export const SearchEntries: Story = {
	args: {
		indexType: "subject",
		entries: mockIndexEntries,
		mentions: mockMentions,
		onValueChange: () => {},
		onCreateNew: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Type search term", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.type(input, "Kant", { delay: 50 });
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify filtered results", async () => {
			const body = within(document.body);
			await waitFor(
				() => {
					const kantEntry = body.getByText("Kant, Immanuel");
					expect(kantEntry).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Select entry", async () => {
			const body = within(document.body);
			const kantEntry = body.getByText("Kant, Immanuel");
			await userEvent.click(kantEntry);
		});
	},
};

/**
 * Test: Create new entry via Enter key
 */
export const CreateNewEntry: Story = {
	args: {
		indexType: "subject",
		entries: mockIndexEntries,
		mentions: mockMentions,
		onValueChange: () => {},
		onCreateNew: (label) => console.log("Create:", label),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.click(input);
		});

		await step("Type non-existent entry", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.type(input, "New Entry Name");
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify empty state message", async () => {
			const body = within(document.body);
			await waitFor(() => {
				const message = body.getByText(/No matching entries/i);
				expect(message).toBeInTheDocument();
			});
		});

		await step("Press Enter to create", async () => {
			await userEvent.keyboard("{Enter}");
			// onCreateNew should be called
		});
	},
};

/**
 * Test: Search by alias
 */
export const SearchByAlias: Story = {
	args: {
		indexType: "subject",
		entries: mockIndexEntries,
		mentions: mockMentions,
		onValueChange: () => {},
		onCreateNew: () => {},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click input to open dropdown", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.click(input);
			await new Promise((resolve) => setTimeout(resolve, 300));
		});

		await step("Type alias search term", async () => {
			const input = canvas.getByPlaceholderText("Search entries...");
			await userEvent.type(input, "Kant, I.", { delay: 50 }); // Alias from mock data
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await step("Verify entry found by alias", async () => {
			const body = within(document.body);
			await waitFor(
				() => {
					const kantEntry = body.getByText("Kant, Immanuel");
					expect(kantEntry).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});
	},
};
