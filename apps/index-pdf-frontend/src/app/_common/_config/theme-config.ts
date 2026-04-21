import type { Attribute } from "next-themes";

/** Props shared by the root layout and Storybook so theme behavior stays aligned. */
export const appThemeProviderProps = {
	attribute: ["class", "data-theme"] as Attribute[],
	defaultTheme: "system",
	enableSystem: true,
	storageKey: "theme",
};
