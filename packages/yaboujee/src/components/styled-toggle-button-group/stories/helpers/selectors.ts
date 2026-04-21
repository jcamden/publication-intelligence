type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const styledToggleButtonGroupSelectors = {
	activeIndex: (canvas: StorybookCanvas) => canvas.getByTestId("active-index"),
	allRoleButtons: (canvas: StorybookCanvas) => canvas.getAllByRole("button"),
	clickableWrapperButtons: (canvas: StorybookCanvas) =>
		styledToggleButtonGroupSelectors
			.allRoleButtons(canvas)
			.filter((_: HTMLElement, index: number) => index % 2 === 0),
	innerButtons: (canvas: StorybookCanvas) =>
		styledToggleButtonGroupSelectors
			.allRoleButtons(canvas)
			.filter((_: HTMLElement, index: number) => index % 2 === 1),
	buttonOrder: (canvas: StorybookCanvas) => canvas.getByTestId("button-order"),
	info: (canvas: StorybookCanvas) => canvas.getByTestId("info"),
	activeCount: (canvas: StorybookCanvas) => canvas.getByTestId("active-count"),
};
