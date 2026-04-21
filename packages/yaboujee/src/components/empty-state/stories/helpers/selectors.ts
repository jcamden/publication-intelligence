type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const emptyStateSelectors = {
	actionButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create project/i }),
};
