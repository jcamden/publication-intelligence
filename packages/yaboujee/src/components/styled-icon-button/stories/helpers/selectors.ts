import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";
import { STYLED_ICON_BUTTON_TEST_IDS } from "../shared";

export const styledIconButtonSelectors = {
	wrapper: (canvas: StorybookCanvas) =>
		canvas.getByTestId(STYLED_ICON_BUTTON_TEST_IDS.wrapper),

	buttonsInWrapper: (canvas: StorybookCanvas) =>
		within(styledIconButtonSelectors.wrapper(canvas)).getAllByRole("button"),

	firstButtonInWrapper: (canvas: StorybookCanvas) =>
		styledIconButtonSelectors.buttonsInWrapper(canvas)[0],

	secondButtonInWrapper: (canvas: StorybookCanvas) =>
		styledIconButtonSelectors.buttonsInWrapper(canvas)[1],

	activeState: (canvas: StorybookCanvas) => canvas.getByTestId("active-state"),

	button1Container: (canvas: StorybookCanvas) => canvas.getByTestId("button-1"),
	button2Container: (canvas: StorybookCanvas) => canvas.getByTestId("button-2"),

	firstButtonInContainer: (container: HTMLElement) =>
		within(container).getAllByRole("button")[0],

	allButtonsOnCanvas: (canvas: StorybookCanvas) =>
		canvas.getAllByRole("button"),
};
