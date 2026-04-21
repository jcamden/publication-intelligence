type StorybookCanvas = ReturnType<typeof import("@storybook/test")["within"]>;

export const logoSelectors = {
	container: (canvas: StorybookCanvas) =>
		canvas.getByTestId("href-test-container"),
	link: (canvas: StorybookCanvas) =>
		logoSelectors.container(canvas).querySelector("a"),
};
