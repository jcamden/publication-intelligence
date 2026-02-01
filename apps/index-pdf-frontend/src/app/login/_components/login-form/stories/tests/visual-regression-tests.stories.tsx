import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { LoginForm } from "../../login-form";

export default {
	title: "Login/LoginForm/tests/Visual Regression Tests",
	component: LoginForm,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const emailInput = canvas.getByLabelText(/email/i);
		const passwordInput = canvas.getByLabelText(/password/i);

		// Trigger validation errors by entering invalid data and blurring
		await user.type(emailInput, "invalid-email");
		await user.tab();
		await user.type(passwordInput, "short");
		await user.tab();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const emailInput = canvas.getByLabelText(/email/i);
		const passwordInput = canvas.getByLabelText(/password/i);

		// Trigger validation errors by entering invalid data and blurring
		await user.type(emailInput, "invalid-email");
		await user.tab();
		await user.type(passwordInput, "short");
		await user.tab();
	},
};
