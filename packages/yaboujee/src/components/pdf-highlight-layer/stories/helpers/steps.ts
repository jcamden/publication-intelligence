import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { pdfHighlightLayerSelectors } from "./selectors";

export const highlightButtonCountIs = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: number;
	step: StoryContext["step"];
}) => {
	await step(`Highlight control count is ${expected}`, async () => {
		const highlights = pdfHighlightLayerSelectors.highlightButtons(canvas);
		await expect(highlights).toHaveLength(expected);
	});
};

export const clickFirstHighlightButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click first highlight control", async () => {
		const highlights = pdfHighlightLayerSelectors.highlightButtons(canvas);
		await user.click(highlights[0]);
	});
};
