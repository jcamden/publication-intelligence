import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { storyWaitForDefaults } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { editorInteractionSelectors } from "./selectors";

export const awaitHighlights = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Highlight layer shows at least one highlight", async () => {
		await waitFor(
			async () => {
				const highlightLayer =
					editorInteractionSelectors.highlightLayer(canvas);
				if (!highlightLayer) {
					throw new Error(
						"Highlight layer not yet rendered - PDF may still be loading",
					);
				}

				const highlights = highlightLayer.querySelectorAll(
					"[data-testid^='highlight-']",
				);
				await expect(highlights.length).toBeGreaterThan(0);
			},
			{ timeout: 15000, interval: 500 },
		);
	});
};

export const clickHighlight = async ({
	canvas,
	highlightId,
	step,
}: {
	canvas: StorybookCanvas;
	highlightId: string;
	step: StoryStep;
}) => {
	await step("Click highlight", async () => {
		const highlight = editorInteractionSelectors.highlight(canvas, highlightId);
		await userEvent.click(highlight);
	});
};

export const waitForDetailsPopoverDialog = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Dialog role is present", async () => {
		await waitFor(
			async () => {
				const body = editorInteractionSelectors.documentBody();
				const popover = body.getByRole("dialog", {
					hidden: true,
				});
				await expect(popover).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const clickHighlightAndWaitForPopover = async ({
	canvas,
	highlightId,
	step,
}: {
	canvas: StorybookCanvas;
	highlightId: string;
	step: StoryStep;
}) => {
	await clickHighlight({ canvas, highlightId, step });
	await waitForDetailsPopoverDialog({ step });
};

export const clickEditInOpenMentionPopover = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Edit button", async () => {
		const body = editorInteractionSelectors.documentBody();
		await userEvent.click(body.getByRole("button", { name: /^edit$/i }));
	});
};

export const clickDeleteInOpenMentionPopover = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Delete button", async () => {
		const body = editorInteractionSelectors.documentBody();
		await userEvent.click(body.getByRole("button", { name: /^delete$/i }));
	});
};

export const clickCancelInOpenMentionPopover = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Cancel button", async () => {
		const body = editorInteractionSelectors.documentBody();
		await userEvent.click(body.getByRole("button", { name: /cancel/i }));
	});
};

export const waitForAlertDialog = async ({ step }: { step: StoryStep }) => {
	await step("Alert dialog is present", async () => {
		await waitFor(
			async () => {
				const body = editorInteractionSelectors.documentBody();
				const dialog = body.getByRole("alertdialog");
				await expect(dialog).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const waitForAlertDialogWithDeleteHighlightCopy = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Alert dialog shows delete highlight copy", async () => {
		await waitFor(
			async () => {
				const body = editorInteractionSelectors.documentBody();
				const dialog = body.getByRole("alertdialog");
				await expect(dialog).toBeInTheDocument();
				await expect(body.getByText(/delete highlight/i)).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const clickDeleteInAlertDialog = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Delete in alert dialog", async () => {
		const body = editorInteractionSelectors.documentBody();
		const dialog = body.getByRole("alertdialog");
		await userEvent.click(
			within(dialog).getByRole("button", { name: /^delete$/i }),
		);
	});
};

export const clickCancelInAlertDialog = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Click Cancel in alert dialog", async () => {
		const body = editorInteractionSelectors.documentBody();
		const dialog = body.getByRole("alertdialog");
		await userEvent.click(
			within(dialog).getByRole("button", { name: /cancel/i }),
		);
	});
};

export const waitForAlertDialogAbsent = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("Alert dialog is not in the document", async () => {
		await waitFor(
			async () => {
				const body = editorInteractionSelectors.documentBody();
				const dialog = body.queryByRole("alertdialog");
				await expect(dialog).not.toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const focusOpenPopoverDialog = async ({ step }: { step: StoryStep }) => {
	await step("Focus open dialog", async () => {
		const body = editorInteractionSelectors.documentBody();
		const popover = body.getByRole("dialog", { hidden: true });
		(popover as HTMLElement).focus();
	});
};

export const pressEscape = async ({ step }: { step: StoryStep }) => {
	await step("Press Escape key", async () => {
		await userEvent.keyboard("{Escape}");
	});
};

export const waitForPdfAnnotationPopoverDetached = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await step("PDF annotation popover host is detached", async () => {
		await waitFor(
			async () => {
				const popover = editorInteractionSelectors.pdfAnnotationPopover();
				await expect(popover).toBeNull();
			},
			{ ...storyWaitForDefaults, timeout: 5000 },
		);
	});
};
