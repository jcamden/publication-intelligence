import type { StorybookCanvas, StoryContext } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { logoSelectors } from "./selectors";

export const logoLinkHasHref = async ({
	canvas,
	expectedHref,
	step,
}: {
	canvas: StorybookCanvas;
	expectedHref: string;
	step: StoryContext["step"];
}) => {
	await step("Logo link has expected href", async () => {
		const link = logoSelectors.link(canvas);
		await expect(link).toBeTruthy();
		await expect(link).toHaveAttribute("href", expectedHref);
	});
};
