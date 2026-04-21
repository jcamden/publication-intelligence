import type { StorybookCanvas, StoryContext } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { pdfThumbnailSelectors } from "./selectors";

export const thumbnailContainerIsInDocument = async ({
	canvas,
	testId,
	step,
}: {
	canvas: StorybookCanvas;
	testId: string;
	step: StoryContext["step"];
}) => {
	await step("Thumbnail wrapper is in the document", async () => {
		const el = pdfThumbnailSelectors.containerByTestId(canvas, testId);
		await expect(el).toBeInTheDocument();
	});
};
