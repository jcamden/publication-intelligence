import {
	defaultGlobals,
	defaultInteractionTestMeta,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { awaitHighlights } from "@/app/_common/_test-helpers/interaction-steps";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { Editor } from "../../editor";
import { SAMPLE_PDF_URL } from "../shared";

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
	...defaultInteractionTestMeta,
	title: "Projects/[ProjectDir]/Editor/tests/Interaction Tests",
	component: Editor,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "fullscreen",
	},
	decorators: [
		TestDecorator,
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
	args: {
		fileUrl: SAMPLE_PDF_URL,
		projectId: "test-project-id",
		documentId: "test-document-id",
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
		projectId: "test-project-id",
		documentId: "test-document-id",
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
		projectId: "test-project-id",
		documentId: "test-document-id",
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

		await step(
			"Focus popover so Escape is dispatched in correct context",
			async () => {
				const body = within(document.body);
				const dialog = body.getByRole("dialog", { hidden: true });
				(dialog as HTMLElement).focus();
			},
		);

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
		projectId: "test-project-id",
		documentId: "test-document-id",
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
