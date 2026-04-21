import type { StorybookCanvas, StoryContext } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor } from "@storybook/test";
import { pdfAnnotationPopoverSelectors } from "./selectors";

export const waitForPopoverTextVisibleInDocument = async ({
	text,
	step,
}: {
	text: string;
	step: StoryContext["step"];
}) => {
	await step("Popover text is in the document", async () => {
		await waitFor(
			async () => {
				const el = pdfAnnotationPopoverSelectors.popoverText(text);
				await expect(el).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const pressEscapeKey = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Press Escape key", async () => {
		await userEvent.keyboard("{Escape}");
	});
};

export const resultShowsText = async ({
	canvas,
	text,
	step,
}: {
	canvas: StorybookCanvas;
	text: string;
	step: StoryContext["step"];
}) => {
	await step(`Result shows ${text}`, async () => {
		const result = pdfAnnotationPopoverSelectors.result(canvas);
		await waitFor(
			async () => {
				await expect(result).toHaveTextContent(text);
			},
			{ timeout: 2000 },
		);
	});
};

export const waitForPopoverContentTestIdInDocument = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Popover content test id is in the document", async () => {
		await waitFor(
			async () => {
				const el = pdfAnnotationPopoverSelectors.popoverContent();
				await expect(el).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const clickCancelButton = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Click Cancel button", async () => {
		const cancelButton = pdfAnnotationPopoverSelectors.cancelButton();
		await userEvent.click(cancelButton);
	});
};

export const popoverIsPositionedLeftOrRightOfAnchor = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Popover bounding box is left or right of anchor", async () => {
		const anchor = pdfAnnotationPopoverSelectors.anchor(canvas);
		const popoverContent = pdfAnnotationPopoverSelectors.popoverContent();
		const popover = popoverContent.closest("[data-pdf-annotation-popover]");

		if (!popover) {
			throw new Error("Popover container not found");
		}

		const anchorRect = anchor.getBoundingClientRect();
		const popoverRect = popover.getBoundingClientRect();

		const isToTheRight = popoverRect.left >= anchorRect.right;
		const isToTheLeft = popoverRect.right <= anchorRect.left;

		await expect(isToTheRight || isToTheLeft).toBe(true);
	});
};
