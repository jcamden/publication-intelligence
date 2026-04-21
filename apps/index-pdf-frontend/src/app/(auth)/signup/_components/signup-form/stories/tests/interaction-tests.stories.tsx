import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { SignupForm } from "../../signup-form";
import {
	alertRolesExist,
	clickCreateAccount,
	createAccountButtonIsNotDisabled,
	createAccountButtonIsVisible,
	emailAndPasswordAriaInvalid,
	pressTabToBlur,
	typeInvalidSignupFields,
	typeSignupCredentials,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Signup/SignupForm/tests/Interaction Tests",
	component: SignupForm,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="flex items-center justify-center p-8">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SignupForm>;

export const FormSubmitsWithValidData: StoryObj<typeof SignupForm> = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await typeSignupCredentials({
			canvas,
			user,
			name: "Test User",
			email: "test@example.com",
			password: "password123",
			step,
		});

		await createAccountButtonIsNotDisabled({ canvas, step });

		await clickCreateAccount({ canvas, user, step });

		await createAccountButtonIsVisible({ canvas, step });
	},
};

export const FormShowsValidationErrors: StoryObj<typeof SignupForm> = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await typeInvalidSignupFields({ canvas, user, step });

		await pressTabToBlur({ user, step });

		await emailAndPasswordAriaInvalid({ canvas, step });

		await alertRolesExist({ canvas, step });
	},
};
