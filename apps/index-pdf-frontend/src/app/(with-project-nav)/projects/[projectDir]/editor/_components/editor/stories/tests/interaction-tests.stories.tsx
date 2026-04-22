import {
	defaultGlobals,
	defaultInteractionTestMeta,
} from "@pubint/storybook-config";
import { waitMs } from "@pubint/yaboujee/_stories";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import {
	TestDecorator,
	TrpcDecorator,
} from "@/app/_common/_test-utils/storybook-utils";
import { Editor } from "../../editor";
import {
	awaitHighlights,
	clickCancelInAlertDialog,
	clickDeleteInAlertDialog,
	clickDeleteInOpenMentionPopover,
	clickEditInOpenMentionPopover,
	clickHighlightAndWaitForPopover,
	focusOpenPopoverDialog,
	pressEscape,
	waitForAlertDialog,
	waitForAlertDialogAbsent,
	waitForAlertDialogWithDeleteHighlightCopy,
	waitForPdfAnnotationPopoverDetached,
} from "../helpers/steps";
import { SAMPLE_PDF_URL } from "../shared";

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
 * Asserts mention details for the top-center highlight in view mode.
 */
export const ClickHighlightShowsDetails: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-top-center",
			step,
		});

		await step("Matching mention label text is in the document", async () => {
			const body = within(document.body);
			await expect(body.getByText(/Should be top center/i)).toBeInTheDocument();
		});

		await step("Edit and Close buttons are in the document", async () => {
			const body = within(document.body);
			await expect(
				body.getByRole("button", { name: /^edit$/i }),
			).toBeInTheDocument();
			await expect(
				body.getByRole("button", { name: /close/i }),
			).toBeInTheDocument();
		});
	},
};

/** Opens edit mode from the mention details popover. */
export const EditButtonOpensHandler: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-top-center",
			step,
		});

		await clickEditInOpenMentionPopover({ step });

		await step(
			"Delete, Cancel, and Save buttons are in the document",
			async () => {
				const body = within(document.body);
				await expect(
					body.getByRole("button", { name: /^delete$/i }),
				).toBeInTheDocument();
				await expect(
					body.getByRole("button", { name: /cancel/i }),
				).toBeInTheDocument();
				await expect(
					body.getByRole("button", { name: /save/i }),
				).toBeInTheDocument();
			},
		);
	},
};

export const DeleteHighlightFlow: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await clickEditInOpenMentionPopover({ step });
		await clickDeleteInOpenMentionPopover({ step });
		await waitForAlertDialogWithDeleteHighlightCopy({ step });
		await clickDeleteInAlertDialog({ step });
		await waitForAlertDialogAbsent({ step });
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

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await clickEditInOpenMentionPopover({ step });
		await clickDeleteInOpenMentionPopover({ step });
		await waitForAlertDialog({ step });
		await clickCancelInAlertDialog({ step });
		await waitForAlertDialogAbsent({ step });
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

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await focusOpenPopoverDialog({ step });
		await pressEscape({ step });
		await waitMs({ ms: 150, step });
		await waitForPdfAnnotationPopoverDetached({ step });
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

		await awaitHighlights({ canvas, step });

		await clickHighlightAndWaitForPopover({
			canvas,
			highlightId: "highlight-mention-bottom-center",
			step,
		});

		await clickEditInOpenMentionPopover({ step });

		await step("Press Delete key", async () => {
			await userEvent.keyboard("{Delete}");
		});

		await waitForAlertDialogWithDeleteHighlightCopy({ step });
	},
};
