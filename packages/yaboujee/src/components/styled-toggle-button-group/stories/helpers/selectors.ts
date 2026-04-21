import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const styledToggleButtonGroupSelectors = {
	activeCount: (canvas: StorybookCanvas) => canvas.getByTestId("active-count"),
	activeIndex: (canvas: StorybookCanvas) => canvas.getByTestId("active-index"),
	allRoleButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),
	buttonOrder: (canvas: StorybookCanvas) => canvas.getByTestId("button-order"),
	clickableWrapperButtons: (canvas: StorybookCanvas) =>
		styledToggleButtonGroupSelectors
			.allRoleButtons(canvas)
			.filter((_: HTMLElement, index: number) => index % 2 === 0),
	info: (canvas: StorybookCanvas) => canvas.getByTestId("info"),
	innerButtons: (canvas: StorybookCanvas) =>
		styledToggleButtonGroupSelectors
			.allRoleButtons(canvas)
			.filter((_: HTMLElement, index: number) => index % 2 === 1),
};
