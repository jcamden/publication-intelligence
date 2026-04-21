import type { StoryContext, StoryUser } from "@pubint/yaboujee/_stories";
import { pressTab, storyWaitForDefaults } from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { editProjectModalSelectors } from "./selectors";

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

/** TanStack Form commits controlled updates after the current stack; blur (e.g. Tab) in the same turn can run onBlur validators against stale state. */
const yieldForFormStateCommit = async (): Promise<void> => {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
};

export const waitForEditProjectModal = async ({ body, step }: StoryContext) => {
	await step("Edit Project modal is visible", async () => {
		await waitFor(async () => {
			const modal = editProjectModalSelectors.root(body);
			await expect(modal).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};

export const projectDataIsLoaded = async ({ body, step }: StoryContext) => {
	await step("Project Title input is populated", async () => {
		await waitFor(async () => {
			const titleInput = editProjectModalSelectors.projectTitleInput(body);
			await expect(titleInput).not.toHaveValue("");
		}, storyWaitForDefaults);
	});
};

export const clickDeleteProjectButton = async ({
	body,
	user,
	step,
}: {
	user: StoryUser;
} & StoryContext) => {
	await step("Click Delete Project button", async () => {
		const deleteButton = editProjectModalSelectors.deleteProjectButton(body);
		await user.click(deleteButton);
	});
};

export const deleteConfirmationDialogIsVisible = async ({
	body,
	step,
}: StoryContext) => {
	await step("Delete confirmation dialog is visible", async () => {
		await waitFor(async () => {
			const confirmPrompt =
				editProjectModalSelectors.deleteConfirmationPrompt(body);
			await expect(confirmPrompt).toBeVisible();
		}, storyWaitForDefaults);
	});
};

export const deleteConfirmationInputIsRequired = async ({
	body,
	step,
}: StoryContext) => {
	await step("Delete confirmation input is visible", async () => {
		const confirmInput =
			editProjectModalSelectors.deleteConfirmationInput(body);
		await expect(confirmInput).toBeInTheDocument();
	});

	await step("Delete confirmation Delete button is disabled", async () => {
		const deleteButton =
			editProjectModalSelectors.deleteConfirmationDeleteButton(body);
		await expect(deleteButton).toBeDisabled();
	});
};

export const clearAndFillProjectTitle = async ({
	body,
	user,
	title,
	step,
}: {
	user: StoryUser;
	title: string;
} & StoryContext) => {
	await step("Replace Project Title input value", async () => {
		const titleInput = editProjectModalSelectors.projectTitleInput(body);
		await user.click(titleInput);
		// Atomic update: userEvent.clear + type can desync TanStack Form under load,
		// so blur validation runs against the previous title and misses duplicate errors.
		setControlledInputValue(titleInput as HTMLElement, title);
		await expect(titleInput).toHaveValue(title);
		await yieldForFormStateCommit();
	});
};

export const clearAndFillProjectDir = async ({
	body,
	user,
	projectDir,
	step,
}: {
	user: StoryUser;
	projectDir: string;
} & StoryContext) => {
	await step("Replace Project Directory input value", async () => {
		const projectDirInput = editProjectModalSelectors.projectDirInput(body);
		await user.click(projectDirInput);
		setControlledInputValue(projectDirInput as HTMLElement, projectDir);
		await expect(projectDirInput).toHaveValue(projectDir);
		await yieldForFormStateCommit();
	});
};

export const projectTitleAlreadyExistsErrorIsVisible = async ({
	body,
	step,
}: StoryContext) => {
	await step("Project title already exists error is visible", async () => {
		await waitFor(async () => {
			const error = editProjectModalSelectors.titleAlreadyExistsError(body);
			await expect(error).toBeVisible();
		}, storyWaitForDefaults);
	});
};

export const projectTitleAlreadyExistsErrorIsNotVisible = async ({
	body,
	step,
}: StoryContext) => {
	await step("Project title already exists error is not visible", async () => {
		const error = editProjectModalSelectors
			.modal(body)
			.queryByText(/a project with this title already exists/i);
		await expect(error).not.toBeInTheDocument();
	});
};

export const projectDirAlreadyInUseErrorIsVisible = async ({
	body,
	step,
}: StoryContext) => {
	await step("Project directory already in use error is visible", async () => {
		await waitFor(async () => {
			const error = editProjectModalSelectors.projectDirAlreadyInUseError(body);
			await expect(error).toBeVisible();
		}, storyWaitForDefaults);
	});
};

export const projectDirAlreadyInUseErrorIsNotVisible = async ({
	body,
	step,
}: StoryContext) => {
	await step(
		"Project directory already in use error is not visible",
		async () => {
			const error = editProjectModalSelectors
				.modal(body)
				.queryByText(/this project directory is already in use/i);
			await expect(error).not.toBeInTheDocument();
		},
	);
};

export const projectTitleInputHasValue = async ({
	body,
	expectedTitle,
	step,
}: {
	expectedTitle: string;
} & StoryContext) => {
	await step("Project Title input has expected value", async () => {
		const titleInput = editProjectModalSelectors.projectTitleInput(body);
		await expect(titleInput).toHaveValue(expectedTitle);
	});
};

export const pauseForDebouncedProjectDirUpdate = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Debounced Project Directory update has settled", async () => {
		await new Promise((resolve) => setTimeout(resolve, 200));
	});
};

export const blurByPressingTab = async ({
	user,
	step,
}: {
	user: StoryUser;
} & Pick<StoryContext, "step">) => {
	await pressTab({ user, step });
};
