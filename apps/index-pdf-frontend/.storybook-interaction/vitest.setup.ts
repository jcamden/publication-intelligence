import { setProjectAnnotations } from "@storybook/nextjs-vite";
import { beforeAll } from "vitest";
import * as previewAnnotations from "./preview";

setProjectAnnotations([previewAnnotations]);

// Clear localStorage once before all tests, then allow persistence between tests
beforeAll(() => {
	if (typeof window !== "undefined" && window.localStorage) {
		window.localStorage.clear();
	}
});
