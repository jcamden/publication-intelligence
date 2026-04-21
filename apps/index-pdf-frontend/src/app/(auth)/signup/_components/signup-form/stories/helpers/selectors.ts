import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const signupFormSelectors = {
	nameInput: (canvas: StorybookCanvas) => canvas.getByLabelText(/name/i),

	emailInput: (canvas: StorybookCanvas) => canvas.getByLabelText(/email/i),

	passwordInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/password/i),

	submitButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create account/i }),

	alerts: (canvas: StorybookCanvas) => canvas.getAllByRole("alert"),
};
