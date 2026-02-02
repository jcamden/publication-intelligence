import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PageScriptureContent } from "../../page-scripture-content";

const meta: Meta<typeof PageScriptureContent> = {
	title:
		"Projects/[ProjectDir]/Editor/PageSidebar/PageScriptureContent/tests/Visual Regression Tests",
	component: PageScriptureContent,
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
	},
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	args: {
		activeAction: { type: null, indexType: null },
		onSelectText: fn(),
		onDrawRegion: fn(),
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
