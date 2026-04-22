import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import { beforeAll } from "vitest";
import * as previewAnnotations from "./preview";

setProjectAnnotations([a11yAddonAnnotations, previewAnnotations]);

// Clear localStorage once before all tests, then allow persistence between tests
beforeAll(() => {
	if (typeof window !== "undefined" && window.localStorage) {
		window.localStorage.clear();
	}
});
