import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { signupFormSelectors } from "./selectors";

export const typeSignupCredentials = async ({
	canvas,
	user,
	name,
	email,
	password,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	name: string;
	email: string;
	password: string;
	step: StoryContext["step"];
}) => {
	await step("Type name, email, and password", async () => {
		await user.type(signupFormSelectors.nameInput(canvas), name);
		await user.type(signupFormSelectors.emailInput(canvas), email);
		await user.type(signupFormSelectors.passwordInput(canvas), password);
	});
};

export const createAccountButtonIsNotDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Create account button is not disabled", async () => {
		await expect(signupFormSelectors.submitButton(canvas)).not.toBeDisabled();
	});
};

export const clickCreateAccount = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Create account button", async () => {
		await user.click(signupFormSelectors.submitButton(canvas));
	});
};

export const createAccountButtonIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Create account button is visible", async () => {
		await expect(signupFormSelectors.submitButton(canvas)).toBeVisible();
	});
};

export const typeInvalidSignupFields = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Type invalid email and short password", async () => {
		await user.type(signupFormSelectors.emailInput(canvas), "invalid-email");
		await user.type(signupFormSelectors.passwordInput(canvas), "short");
	});
};

export const pressTabToBlur = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Press Tab to blur fields", async () => {
		await user.tab();
	});
};

export const emailAndPasswordAriaInvalid = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Email and password inputs have aria-invalid true", async () => {
		await expect(signupFormSelectors.emailInput(canvas)).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		await expect(signupFormSelectors.passwordInput(canvas)).toHaveAttribute(
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
		const errors = signupFormSelectors.alerts(canvas);
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
			await user.type(signupFormSelectors.emailInput(canvas), "invalid-email");
			await user.tab();
			await user.type(signupFormSelectors.passwordInput(canvas), "short");
			await user.tab();
		},
	);
};
