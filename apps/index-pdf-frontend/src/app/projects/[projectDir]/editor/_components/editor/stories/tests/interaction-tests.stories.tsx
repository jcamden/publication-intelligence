import {
	defaultGlobals,
	interactionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import type { Mention } from "../../editor";
import { Editor } from "../../editor";
import { SAMPLE_PDF_URL } from "../shared";

// Mock mentions with unique IDs to avoid conflicts with mockHighlights
// These use "mention-" prefix to distinguish them from the mockHighlights in Editor
const MOCK_MENTIONS: Mention[] = [
	{
		id: "mention-top-left",
		pageNumber: 1,
		text: "Should be in top-left corner",
		entryId: "entry-1",
		entryLabel: "Test Entry 1",
		indexTypes: ["subject"],
		type: "text" as const,
		bboxes: [{ x: 20, y: 772, width: 100, height: 15 }],
		createdAt: new Date("2024-01-01"),
	},
	{
		id: "mention-center",
		pageNumber: 1,
		text: "Should be centered",
		entryId: "entry-2",
		entryLabel: "Test Entry 2",
		indexTypes: ["author"],
		type: "text" as const,
		bboxes: [{ x: 256, y: 388, width: 100, height: 15 }],
		createdAt: new Date("2024-01-02"),
	},
	{
		id: "mention-bottom-center",
		pageNumber: 1,
		text: "Should be bottom center",
		entryId: "entry-3",
		entryLabel: "Test Entry 3",
		indexTypes: ["scripture"],
		type: "text" as const,
		bboxes: [{ x: 256, y: 5, width: 100, height: 15 }],
		createdAt: new Date("2024-01-03"),
	},
	{
		id: "mention-top-center",
		pageNumber: 1,
		text: "Should be top center",
		entryId: "entry-4",
		entryLabel: "Test Entry 4",
		indexTypes: ["subject"],
		type: "text" as const,
		bboxes: [{ x: 256, y: 772, width: 100, height: 15 }],
		createdAt: new Date("2024-01-04"),
	},
	{
		id: "mention-left-middle",
		pageNumber: 1,
		text: "Should be left middle",
		entryId: "entry-5",
		entryLabel: "Test Entry 5",
		indexTypes: ["author"],
		type: "text" as const,
		bboxes: [{ x: 20, y: 388, width: 100, height: 15 }],
		createdAt: new Date("2024-01-05"),
	},
	{
		id: "mention-right-middle",
		pageNumber: 1,
		text: "Should be right middle",
		entryId: "entry-6",
		entryLabel: "Test Entry 6",
		indexTypes: ["scripture"],
		type: "text" as const,
		bboxes: [{ x: 492, y: 388, width: 100, height: 15 }],
		createdAt: new Date("2024-01-06"),
	},
];

const awaitHighlights = async ({
	canvas,
}: {
	canvas: ReturnType<typeof within>;
}) => {
	// Wait for highlights to render at 50% zoom
	await waitFor(
		async () => {
			const highlightLayer = canvas.getByTestId("pdf-highlight-layer");
			const highlights = highlightLayer.querySelectorAll(
				"[data-testid^='highlight-']",
			);
			await expect(highlights.length).toBeGreaterThan(0);
		},
		{ timeout: 10000 },
	);
};

// Shared helper: Click a highlight and wait for details popover
const clickHighlightAndWaitForPopover = async ({
	canvas,
	highlightId,
	step,
}: {
	canvas: ReturnType<typeof within>;
	highlightId: string;
	// biome-ignore lint/suspicious/noExplicitAny: Step function type is complex, usage is type-safe
	step: any;
}) => {
	await step("Click highlight", async () => {
		const highlight = canvas.getByTestId(highlightId);
		await userEvent.click(highlight);
	});

	await step("Wait for details popover", async () => {
		await waitFor(
			async () => {
				// Wait for the popover dialog to appear (MentionDetailsPopover has role="dialog")
				const popover = within(document.body).getByRole("dialog", {
					hidden: true,
				});
				await expect(popover).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

const meta: Meta<typeof Editor> = {
	title: "Projects/[ProjectDir]/Editor/tests/Interaction Tests",
	component: Editor,
	tags: ["test:interaction"],
	parameters: {
		...interactionTestConfig,
		layout: "fullscreen",
	},
	args: {
		fileUrl: SAMPLE_PDF_URL,
		initialMentions: MOCK_MENTIONS,
	},
	globals: {
		...defaultGlobals,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * PDF loading, highlight rendering, and zoom setup (50%) are handled by decorator/beforeEach.
 */
export const ClickHighlightShowsDetails: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-top-center",
			step,
		});

		await step("Verify popover shows mention information", async () => {
			const body = within(document.body);
			await expect(body.getByText(/Should be top center/i)).toBeInTheDocument();
			// In View mode, the popover has Edit and Close buttons
			await expect(
				body.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument();
			await expect(
				body.getByRole("button", { name: /close/i }),
			).toBeInTheDocument();
		});
	},
};

export const EditButtonOpensHandler: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-top-center",
			step,
		});

		await step("Click Edit button", async () => {
			const body = within(document.body);
			const editButton = body.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Verify entered Edit mode", async () => {
			const body = within(document.body);
			// In Edit mode, should see Delete, Cancel, and Save buttons
			await expect(
				body.getByRole("button", { name: /^delete$/i }),
			).toBeInTheDocument();
			await expect(
				body.getByRole("button", { name: /cancel/i }),
			).toBeInTheDocument();
			await expect(
				body.getByRole("button", { name: /save/i }),
			).toBeInTheDocument();
		});
	},
};

export const DeleteHighlightFlow: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await step("Enter Edit mode", async () => {
			const body = within(document.body);
			const editButton = body.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Click Delete button", async () => {
			const body = within(document.body);
			const deleteButton = body.getByRole("button", { name: /^delete$/i });
			await userEvent.click(deleteButton);
		});

		await step("Verify confirmation dialog appears", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
					await expect(body.getByText(/delete highlight/i)).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Confirm deletion", async () => {
			const body = within(document.body);
			const confirmButton = body.getByRole("button", { name: /^delete$/i });
			await userEvent.click(confirmButton);
		});

		await step("Verify dialog closes", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const dialog = body.queryByRole("alertdialog");
					expect(dialog).not.toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const CancelDeletion: Story = {
	args: {
		fileUrl: SAMPLE_PDF_URL,
		initialMentions: MOCK_MENTIONS,
	},
	globals: {
		...defaultGlobals,
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await step("Enter Edit mode", async () => {
			const body = within(document.body);
			const editButton = body.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Click Delete button", async () => {
			const body = within(document.body);
			const deleteButton = body.getByRole("button", { name: /^delete$/i });
			await userEvent.click(deleteButton);
		});

		await step("Verify confirmation dialog appears", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});

		await step("Cancel deletion", async () => {
			const body = within(document.body);
			const cancelButton = body.getByRole("button", { name: /cancel/i });
			await userEvent.click(cancelButton);
		});

		await step("Verify dialog closes", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const dialog = body.queryByRole("alertdialog");
					expect(dialog).not.toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const EscapeKeyClosesPopover: Story = {
	args: {
		fileUrl: SAMPLE_PDF_URL,
		initialMentions: MOCK_MENTIONS,
	},
	globals: {
		...defaultGlobals,
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await step("Press Escape key", async () => {
			await userEvent.keyboard("{Escape}");
		});

		await step("Verify popover closes", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const popover = body.queryByRole("dialog", { hidden: true });
					expect(popover).not.toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const DeleteKeyShortcut: Story = {
	args: {
		fileUrl: SAMPLE_PDF_URL,
		initialMentions: MOCK_MENTIONS,
	},
	globals: {
		...defaultGlobals,
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await step("Enter Edit mode", async () => {
			const body = within(document.body);
			const editButton = body.getByRole("button", { name: /^edit$/i });
			await userEvent.click(editButton);
		});

		await step("Press Delete key", async () => {
			await userEvent.keyboard("{Delete}");
		});

		await step("Verify confirmation dialog appears", async () => {
			await waitFor(
				async () => {
					const body = within(document.body);
					const dialog = body.getByRole("alertdialog");
					await expect(dialog).toBeInTheDocument();
					await expect(body.getByText(/delete highlight/i)).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};
