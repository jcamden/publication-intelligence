import type { StoryContext, StoryUser } from "@pubint/yaboujee/_stories";
import { pressTab, storyWaitForDefaults } from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { createProjectModalSelectors } from "./selectors";

/**
 * Sets a controlled `<input>` value without importing `@testing-library/react`.
 * That import breaks Storybook+Vite browser tests (dynamic import of react-18 chunks).
 */
const setControlledInputValue = (element: HTMLElement, value: string): void => {
	const input = element as HTMLInputElement;
	const valueSetter = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		"value",
	)?.set;
	if (valueSetter) {
		valueSetter.call(input, value);
	} else {
		input.value = value;
	}
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
};

export const waitForCreateProjectModal = async ({
	body,
	step,
}: StoryContext) => {
	await step("Create Project modal is visible", async () => {
		await waitFor(async () => {
			const dialog = createProjectModalSelectors.root(body);
			await expect(dialog).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};

export const expectCreateProjectSubmitDisabled = async ({
	body,
	step,
}: StoryContext) => {
	await step("Submit button is disabled", async () => {
		const submitButton = createProjectModalSelectors.submitButton(body);
		await expect(submitButton).toBeDisabled();
	});
};

export const fillProjectDirInput = async ({
	body,
	user,
	projectDir,
	step,
}: {
	user: StoryUser;
	projectDir: string;
} & StoryContext) => {
	await step("Fill Project Directory input", async () => {
		const projectDirInput = createProjectModalSelectors.projectDirInput(body);
		await user.type(projectDirInput, projectDir);
	});
};

export const blurProjectDirInput = async ({ body, step }: StoryContext) => {
	await step("Blur Project Directory input", async () => {
		const projectDirInput = createProjectModalSelectors.projectDirInput(body);
		(projectDirInput as HTMLElement).blur();
	});
};

export const expectProjectDirAlreadyExistsError = async ({
	body,
	step,
}: StoryContext) => {
	await step("Project directory already in use error is visible", async () => {
		await waitFor(async () => {
			const error =
				createProjectModalSelectors.projectDirAlreadyInUseError(body);
			await expect(error).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};

export const fillProjectTitleInput = async ({
	body,
	user,
	title,
	step,
}: {
	user: StoryUser;
	title: string;
} & StoryContext) => {
	await step("Fill Project Title input", async () => {
		const titleInput = createProjectModalSelectors.titleInput(body);
		await user.type(titleInput, title);
	});
};

export const expectTitleAlreadyExistsError = async ({
	body,
	step,
}: StoryContext) => {
	// Validation runs on blur; use waitFor with generous timeout for debounced
	// React updates when tests run under load (e.g. parallel pre-commit).
	await step("Project title already exists error is visible", async () => {
		await waitFor(async () => {
			const error =
				createProjectModalSelectors.projectTitleAlreadyExistsError(body);
			await expect(error).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};

export const setProjectTitleAtomically = async ({
	body,
	user,
	title,
	step,
}: {
	user: StoryUser;
	title: string;
} & StoryContext) => {
	await step("Fill Project Title input", async () => {
		const titleInput = createProjectModalSelectors.titleInput(body);
		await user.click(titleInput);
		// Single atomic update keeps debounced title + slug in sync; userEvent.type
		// can flake under load (partial value like "Wor").
		setControlledInputValue(titleInput as HTMLElement, title);
		await expect(titleInput).toHaveValue(title);
	});
};

export const waitForProjectDirSlug = async ({
	body,
	expectedSlug,
	step,
}: {
	expectedSlug: string;
} & StoryContext) => {
	// Debounced slug update (500ms) after title value settles
	await step("Project Directory input has expected value", async () => {
		const projectDirInput = createProjectModalSelectors.projectDirInput(body);
		await waitFor(
			async () => {
				await expect(projectDirInput).toHaveValue(expectedSlug);
			},
			{ ...storyWaitForDefaults, timeout: 10000 },
		);
	});
};

/** VRT: open modal, then duplicate title + directory with blur (errors visible). */
export const vrtDuplicateTitleAndDirectoryInCreateModal = async ({
	body,
	user,
	step,
}: StoryContext & { user: StoryUser }) => {
	await waitForCreateProjectModal({ body, step });
	await fillProjectTitleInput({
		body,
		user,
		title: "Existing Project",
		step,
	});
	await pressTab({ user, step });
	await fillProjectDirInput({
		body,
		user,
		projectDir: "existing-project",
		step,
	});
	await pressTab({ user, step });
};
