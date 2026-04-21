import type { StorybookCanvas, StoryContext } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { formFooterSelectors } from "./selectors";

export const footerLinkMatchesExpectedTarget = async ({
	canvas,
	linkText,
	linkHref,
	step,
}: {
	canvas: StorybookCanvas;
	linkText: string;
	linkHref: string;
	step: StoryContext["step"];
}) => {
	await step(
		"Footer link is visible with expected href and tag name",
		async () => {
			const link = formFooterSelectors.linkByText(canvas, linkText);
			await expect(link).toBeVisible();
			await expect(link).toHaveAttribute("href", linkHref);
			await expect(link.tagName.toLowerCase()).toBe("a");
		},
	);
};
