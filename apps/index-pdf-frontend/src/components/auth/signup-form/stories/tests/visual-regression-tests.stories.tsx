import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { SignupForm } from "../../signup-form";
import { TrpcDecorator } from "../shared";

export default {
	title: "Components/Auth/SignupForm/tests/Visual Regression Tests",
	component: SignupForm,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="flex items-center justify-center p-8 min-h-screen">
				<TrpcDecorator>
					<Story />
				</TrpcDecorator>
			</div>
		),
	],
} satisfies Meta<typeof SignupForm>;

export const MobileLight: StoryObj<typeof SignupForm> = {
	globals: {
		...defaultGlobals,
		theme: "light",
		viewport: { value: "mobile1" },
	},
};

export const MobileDark: StoryObj<typeof SignupForm> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	globals: {
		...defaultGlobals,
		theme: "dark",
		viewport: { value: "mobile1" },
	},
};

export const ErrorStateLight: StoryObj<typeof SignupForm> = {
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

export const ErrorStateDark: StoryObj<typeof SignupForm> = {
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
