import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { projectCardSelectors } from "./selectors";

export const cardLinkVisibleWithHref = async ({
	canvas,
	expectedHref,
	step,
}: {
	canvas: StorybookCanvas;
	expectedHref: string;
	step: StoryContext["step"];
}) => {
	await step("Project card link is visible with expected href", async () => {
		const card = projectCardSelectors.cardLink(canvas);
		await expect(card).toBeVisible();
		await expect(card).toHaveAttribute("href", expectedHref);
	});
};

export const settingsButtonInDocumentAfterHoverCard = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Settings control exists then card is hovered", async () => {
		const settingsButton = projectCardSelectors.settingsButton(canvas);
		await expect(settingsButton).toBeInTheDocument();
		const card = projectCardSelectors.cardLink(canvas);
		await user.hover(card);
		await expect(settingsButton).toBeInTheDocument();
	});
};

export const hoverCardAndClickSettings = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Hover card and click project settings", async () => {
		const card = projectCardSelectors.cardLink(canvas);
		await user.hover(card);
		const settingsButton = projectCardSelectors.settingsButton(canvas);
		await user.click(settingsButton);
	});
};

export const settingsButtonStillInDocument = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Project settings control is still in the document", async () => {
		const settingsButton = projectCardSelectors.settingsButton(canvas);
		await expect(settingsButton).toBeInTheDocument();
	});
};

/** VRT: pseudo-hover snapshot settles before capture. */
export const vrtPauseBeforePseudoHoverSnapshot = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await waitMs({ ms: 300, step });
};
