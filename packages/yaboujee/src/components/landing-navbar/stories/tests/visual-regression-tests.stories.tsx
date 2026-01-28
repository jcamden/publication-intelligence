import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { LandingNavbar } from "../../landing-navbar";
import { NavbarOnly } from "../shared";

export default {
	title: "Components/LandingNavbar/tests/Visual Regression Tests",
	component: LandingNavbar,
	tags: ["visual-regression"],
	parameters: {
		layout: "fullscreen",
		...visualRegressionTestConfig,
	},
} satisfies Meta<typeof LandingNavbar>;

export const DefaultLight: StoryObj<typeof LandingNavbar> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2", isRotated: true },
	},
	render: () => <NavbarOnly />,
};

export const DefaultDark: StoryObj<typeof LandingNavbar> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile2", isRotated: true },
	},
	render: () => <NavbarOnly initialTheme="dark" />,
};

export const MobileViewportLight: StoryObj<typeof LandingNavbar> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => <NavbarOnly />,
};

export const MobileViewportDark: StoryObj<typeof LandingNavbar> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
	render: () => <NavbarOnly initialTheme="dark" />,
};
