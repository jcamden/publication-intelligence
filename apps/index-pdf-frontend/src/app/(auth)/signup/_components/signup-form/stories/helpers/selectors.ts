import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const signupFormSelectors = {
	alerts: (canvas: StorybookCanvas) => canvas.getAllByRole("alert"),
	emailInput: (canvas: StorybookCanvas) => canvas.getByLabelText(/email/i),
	nameInput: (canvas: StorybookCanvas) => canvas.getByLabelText(/name/i),
	passwordInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/password/i),
	submitButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /create account/i }),
};
