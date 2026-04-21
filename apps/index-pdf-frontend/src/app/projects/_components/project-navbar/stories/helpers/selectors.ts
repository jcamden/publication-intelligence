import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export const projectNavbarSelectors = {
	editorLink: (canvas: StorybookCanvas) =>
		canvas.getByRole("link", { name: /editor/i }),

	indexLink: (canvas: StorybookCanvas) =>
		canvas.getByRole("link", { name: /^index$/i }),

	projectsLink: (canvas: StorybookCanvas) =>
		canvas.getByRole("link", { name: /projects/i }),

	themeToggle: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", {
			name: /switch to (dark|light) mode/i,
		}),

	userMenuButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /user menu/i }),

	logoLink: (canvas: StorybookCanvas) =>
		canvas.getByRole("link", { name: /indexpdf/i }),

	allLinks: (canvas: StorybookCanvas) => canvas.queryAllByRole("link"),

	documentBody: () => within(document.body),

	signOutMenuItem: () =>
		projectNavbarSelectors
			.documentBody()
			.getByRole("menuitem", { name: /sign out/i }),
};
