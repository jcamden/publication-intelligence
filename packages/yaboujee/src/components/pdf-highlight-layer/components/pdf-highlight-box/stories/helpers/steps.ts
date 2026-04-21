import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { pdfHighlightBoxSelectors } from "./selectors";

export const clickHighlightAndExpectPresent = async ({
	canvas,
	user,
	testId,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	testId: string;
	step: StoryContext["step"];
}) => {
	await step("Click highlight control", async () => {
		const highlightButton = pdfHighlightBoxSelectors.highlightByTestId(
			canvas,
			testId,
		);
		await user.click(highlightButton);
		await expect(highlightButton).toBeInTheDocument();
	});
};
