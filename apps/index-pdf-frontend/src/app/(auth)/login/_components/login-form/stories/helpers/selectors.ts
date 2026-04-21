import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const loginFormSelectors = {
	emailInput: (canvas: StorybookCanvas) => canvas.getByLabelText(/email/i),

	passwordInput: (canvas: StorybookCanvas) =>
		canvas.getByLabelText(/password/i),

	submitButton: (canvas: StorybookCanvas) =>
		canvas.getByRole("button", { name: /sign in/i }),

	alerts: (canvas: StorybookCanvas) => canvas.getAllByRole("alert"),
};
