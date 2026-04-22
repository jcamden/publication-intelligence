import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { LoginForm } from "../../login-form";
import {
	alertRolesExist,
	clickSignIn,
	fieldsHaveAriaInvalid,
	submitButtonIsNotDisabled,
	submitButtonIsVisible,
	typeLoginCredentials,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Login/LoginForm/tests/Interaction Tests",
	component: LoginForm,
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
} satisfies Meta<typeof LoginForm>;

export const FormSubmitsWithValidData: StoryObj<typeof LoginForm> = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await typeLoginCredentials({
			canvas,
			user,
			email: "test@example.com",
			password: "password123",
			step,
		});

		await submitButtonIsNotDisabled({ canvas, step });

		await clickSignIn({ canvas, user, step });

		await submitButtonIsVisible({ canvas, step });
	},
};

export const FormShowsValidationErrors: StoryObj<typeof LoginForm> = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		await typeLoginCredentials({
			canvas,
			user,
			email: "invalid-email",
			password: "short",
			step,
		});

		await step("Press Tab to blur fields", async () => {
			await user.tab();
		});

		await fieldsHaveAriaInvalid({ canvas, step });

		await alertRolesExist({ canvas, step });
	},
};
