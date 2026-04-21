import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { loginFormSelectors } from "./selectors";

export const typeLoginCredentials = async ({
	canvas,
	user,
	email,
	password,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	email: string;
	password: string;
	step: StoryContext["step"];
}) => {
	await step("Type email and password", async () => {
		await user.type(loginFormSelectors.emailInput(canvas), email);
		await user.type(loginFormSelectors.passwordInput(canvas), password);
	});
};

export const submitButtonIsNotDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Sign in button is not disabled", async () => {
		const submit = loginFormSelectors.submitButton(canvas);
		await expect(submit).not.toBeDisabled();
	});
};

export const clickSignIn = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Sign in button", async () => {
		await user.click(loginFormSelectors.submitButton(canvas));
	});
};

export const submitButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Sign in button is visible", async () => {
		await expect(loginFormSelectors.submitButton(canvas)).toBeVisible();
	});
};

export const fieldsHaveAriaInvalid = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Email and password inputs have aria-invalid true", async () => {
		await expect(loginFormSelectors.emailInput(canvas)).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		await expect(loginFormSelectors.passwordInput(canvas)).toHaveAttribute(
			"aria-invalid",
			"true",
		);
	});
};

export const alertRolesExist = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("At least one alert role is present", async () => {
		const errors = loginFormSelectors.alerts(canvas);
		await expect(errors.length).toBeGreaterThan(0);
	});
};

/** VRT: invalid values typed and blurred so validation UI is visible. */
export const showValidationErrorsForVrt = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step(
		"Invalid email and password are entered and blurred for snapshot",
		async () => {
			await user.type(loginFormSelectors.emailInput(canvas), "invalid-email");
			await user.tab();
			await user.type(loginFormSelectors.passwordInput(canvas), "short");
			await user.tab();
		},
	);
};
