import type { StoryContext } from "@pubint/yaboujee/_stories";
import { pressTab } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { styledToggleButtonGroupSelectors } from "./selectors";

type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;
type StoryUser = ReturnType<
	typeof import("@storybook/test")["userEvent"]["setup"]
>;

export const activeIndexShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Active index shows ${expected}`, async () => {
		const activeIndex = styledToggleButtonGroupSelectors.activeIndex(canvas);
		await expect(activeIndex).toHaveTextContent(expected);
	});
};

export const clickClickableButtonAtIndex = async ({
	canvas,
	user,
	index,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	index: number;
	step: StoryContext["step"];
}) => {
	await step(`Click toggle button at index ${index}`, async () => {
		const clickable =
			styledToggleButtonGroupSelectors.clickableWrapperButtons(canvas)[index];
		await user.click(clickable);
	});
};

export const focusClickableButtonAtIndex = async ({
	canvas,
	index,
	step,
}: {
	canvas: StorybookCanvas;
	index: number;
	step: StoryContext["step"];
}) => {
	await step(`Focus toggle button at index ${index}`, async () => {
		const clickable =
			styledToggleButtonGroupSelectors.clickableWrapperButtons(canvas)[index];
		clickable.focus();
	});
};

export const clickableButtonAtIndexHasFocus = async ({
	canvas,
	index,
	step,
}: {
	canvas: StorybookCanvas;
	index: number;
	step: StoryContext["step"];
}) => {
	await step(`Toggle button at index ${index} has focus`, async () => {
		const clickable =
			styledToggleButtonGroupSelectors.clickableWrapperButtons(canvas)[index];
		await expect(clickable).toHaveFocus();
	});
};

export const tabTwice = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await pressTab({ user, step });
	await pressTab({ user, step });
};

export const buttonOrderShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step("Button order text matches expected", async () => {
		const order = styledToggleButtonGroupSelectors.buttonOrder(canvas);
		await expect(order).toHaveTextContent(expected);
	});
};

export const roleButtonsExist = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("At least one button exists", async () => {
		const buttons = styledToggleButtonGroupSelectors.allRoleButtons(canvas);
		await expect(buttons.length).toBeGreaterThan(0);
	});
};

export const infoTextIsVisible = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string | RegExp;
	step: StoryContext["step"];
}) => {
	await step("Info text is visible", async () => {
		const info = styledToggleButtonGroupSelectors.info(canvas);
		await expect(info).toHaveTextContent(expected);
	});
};

export const activeCountShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Active count shows ${expected}`, async () => {
		const activeCount = styledToggleButtonGroupSelectors.activeCount(canvas);
		await expect(activeCount).toHaveTextContent(expected);
	});
};

export const clickableButtonCountIs = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: number;
	step: StoryContext["step"];
}) => {
	await step(`Clickable toggle button count is ${expected}`, async () => {
		const clickable =
			styledToggleButtonGroupSelectors.clickableWrapperButtons(canvas);
		await expect(clickable.length).toBe(expected);
	});
};

export const allClickableButtonsAreVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("All clickable toggle buttons are visible", async () => {
		const clickable =
			styledToggleButtonGroupSelectors.clickableWrapperButtons(canvas);
		for (const button of clickable) {
			await expect(button).toBeVisible();
		}
	});
};

export const innerButtonsHaveExpectedAccessibleNames = async ({
	canvas,
	names,
	step,
}: {
	canvas: StorybookCanvas;
	names: string[];
	step: StoryContext["step"];
}) => {
	await step(
		"Inner toggle buttons have expected accessible names",
		async () => {
			const inner = styledToggleButtonGroupSelectors.innerButtons(canvas);
			for (let i = 0; i < names.length; i++) {
				await expect(inner[i]).toHaveAccessibleName(names[i]);
			}
		},
	);
};
