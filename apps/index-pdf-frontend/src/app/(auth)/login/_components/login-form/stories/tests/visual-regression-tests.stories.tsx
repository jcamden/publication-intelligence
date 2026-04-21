import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { LoginForm } from "../../login-form";
import { showValidationErrorsForVrt } from "../helpers/steps";

export default {
	...defaultVrtMeta,
	title: "Login/LoginForm/tests/Visual Regression Tests",
	component: LoginForm,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="flex items-center justify-center p-8 min-h-screen">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof LoginForm>;

export const MobileLight: StoryObj<typeof LoginForm> = {
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "mobile1" },
	},
};

export const MobileDark: StoryObj<typeof LoginForm> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
};

export const ErrorStateLight: StoryObj<typeof LoginForm> = {
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await showValidationErrorsForVrt({ canvas, user, step });
	},
};

export const ErrorStateDark: StoryObj<typeof LoginForm> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await showValidationErrorsForVrt({ canvas, user, step });
	},
};
