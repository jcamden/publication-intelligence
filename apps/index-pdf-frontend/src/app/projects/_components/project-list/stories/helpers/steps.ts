import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { projectListSelectors } from "./selectors";

export const threeMockProjectTitlesAreVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Three project titles are visible", async () => {
		await expect(
			projectListSelectors.projectTitle(
				canvas,
				"Word Biblical Commentary: Daniel",
			),
		).toBeVisible();
		await expect(
			projectListSelectors.projectTitle(canvas, "NIV Study Bible"),
		).toBeVisible();
		await expect(
			projectListSelectors.projectTitle(canvas, "Systematic Theology"),
		).toBeVisible();
	});
};

export const loadingSkeletonCardsExist = async ({
	canvasElement,
	step,
}: {
	canvasElement: HTMLElement;
	step: StoryContext["step"];
}) => {
	await step("Loading skeleton elements are present", async () => {
		const skeletonCards =
			projectListSelectors.skeletonPulseElements(canvasElement);
		await expect(skeletonCards.length).toBeGreaterThan(0);
	});
};

export const emptyStateAndCreateButtonVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Empty copy and create project button are visible", async () => {
		await expect(projectListSelectors.emptyMessage(canvas)).toBeVisible();
		await expect(
			projectListSelectors.createProjectButton(canvas),
		).toBeVisible();
	});
};

export const hoverFirstCardAndClickFirstSettings = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("At least one settings control exists", async () => {
		const settingsButtons = projectListSelectors.settingsButtons(canvas);
		await expect(settingsButtons.length).toBeGreaterThan(0);
	});

	await step("Hover first card and click first settings control", async () => {
		const settingsButtons = projectListSelectors.settingsButtons(canvas);
		const firstCard = projectListSelectors.cardLinks(canvas)[0];
		await user.hover(firstCard);
		await user.click(settingsButtons[0]);
	});
};

export const cardLinkCountAndFirstHref = async ({
	canvas,
	expectedCount,
	firstHref,
	step,
}: {
	canvas: StorybookCanvas;
	expectedCount: number;
	firstHref: string;
	step: StoryContext["step"];
}) => {
	await step("Card link count and first href match", async () => {
		const cards = projectListSelectors.cardLinks(canvas);
		await expect(cards.length).toBe(expectedCount);
		await expect(cards[0]).toHaveAttribute("href", firstHref);
	});
};
