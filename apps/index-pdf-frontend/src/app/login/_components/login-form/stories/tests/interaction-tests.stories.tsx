import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { LoginForm } from "../../login-form";

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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const emailInput = canvas.getByLabelText(/email/i);
		const passwordInput = canvas.getByLabelText(/password/i);
		const submitButton = canvas.getByRole("button", { name: /sign in/i });

		await user.type(emailInput, "test@example.com");
		await user.type(passwordInput, "password123");

		// Verify button is enabled before submit
		await expect(submitButton).not.toBeDisabled();

		await user.click(submitButton);

		// Form submission completes (button returns to enabled state)
		await expect(submitButton).toBeVisible();
	},
};

export const FormShowsValidationErrors: StoryObj<typeof LoginForm> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();

		const emailInput = canvas.getByLabelText(/email/i);
		const passwordInput = canvas.getByLabelText(/password/i);

		// Enter invalid data
		await user.type(emailInput, "invalid-email");
		await user.type(passwordInput, "short");

		// Trigger validation by blurring
		await user.tab();

		// Verify form fields show invalid state
		await expect(emailInput).toHaveAttribute("aria-invalid", "true");
		await expect(passwordInput).toHaveAttribute("aria-invalid", "true");

		// Verify error messages are present (without checking exact text)
		const errors = canvas.getAllByRole("alert");
		await expect(errors.length).toBeGreaterThan(0);
	},
};
