import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const windowInteractionSelectors = {
	closeButtonIn: (region: HTMLElement) =>
		within(region).getByLabelText("Close"),
	focusState: (canvas: StorybookCanvas) => canvas.getByTestId("focus-state"),
	maximizeButton: (canvas: StorybookCanvas) =>
		canvas.getByLabelText("Maximize"),
	maximizedState: (canvas: StorybookCanvas) =>
		canvas.getByTestId("maximized-state"),
	regionByTestId: (canvas: StorybookCanvas, testId: string) =>
		canvas.getByTestId(testId),
	unpopButtonIn: (region: HTMLElement) =>
		within(region).getByLabelText("Return to sidebar"),
	windowTitleHeading: (canvas: StorybookCanvas, name: RegExp) =>
		canvas.getByRole("heading", { name }),
};
