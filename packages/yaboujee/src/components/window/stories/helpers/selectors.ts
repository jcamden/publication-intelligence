import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const windowInteractionSelectors = {
	focusState: (canvas: StorybookCanvas) => canvas.getByTestId("focus-state"),

	windowTitleHeading: (canvas: StorybookCanvas, name: RegExp) =>
		canvas.getByRole("heading", { name }),

	maximizeButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Maximize"),

	maximizedState: (canvas: StorybookCanvas) =>
		canvas.getByTestId("maximized-state"),

	regionByTestId: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),

	unpopButtonIn: (region: HTMLElement) =>
		within(region).getByLabelText("Return to sidebar"),

	closeButtonIn: (region: HTMLElement) =>
		within(region).getByLabelText("Close"),
};
