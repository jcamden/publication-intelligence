type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const errorStateSelectors = {
	retryButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /try again/i }),
};
