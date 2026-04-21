import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const logoSelectors = {
	container: (canvas: StorybookCanvas) =>
		canvas.getByTestId("href-test-container"),
	link: (canvas: StorybookCanvas) =>
		logoSelectors.container(canvas).querySelector("a"),
};
