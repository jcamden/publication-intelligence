import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "../../alert";
import { AllVariantsStack } from "../shared";

export default {
	...defaultVrtMeta,
	title: "Components/Alert/tests/Visual Regression Tests",
	component: Alert,
	parameters: {
		...defaultVrtMeta.parameters,
	},
} satisfies Meta<typeof Alert>;

// Note: Inline globals for VRT (re-exports don't capture globals from shared)
export const AllVariantsNarrowContainer: StoryObj<typeof Alert> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => <AllVariantsStack />,
};

export const AllVariantsNarrowContainerWithCustomStyle: StoryObj<typeof Alert> =
	{
		globals: {
			...defaultGlobals,
			viewport: { value: "mobile1" },
		},
		render: () => <AllVariantsStack customStyle="shadow-lg" />,
	};

export const AllVariantsNarrowContainerWithCustomStyleDark: StoryObj<
	typeof Alert
> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },

		backgrounds: {
			value: "dark",
		},
	},

	render: () => <AllVariantsStack customStyle="shadow-lg" />,
};

export const AllVariantsNarrowContainerDark: StoryObj<typeof Alert> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },

		backgrounds: {
			value: "dark",
		},
	},

	render: () => <AllVariantsStack />,
};
