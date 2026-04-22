import type { StoryContext, StoryUser } from "@pubint/yaboujee/_stories";
import {
	setControlledInputValue,
	storyWaitForDefaults,
} from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { editProjectModalSelectors } from "./selectors";

/**
 * TanStack Form can apply controlled values after microtasks + frame; a single macrotask
 * (`setTimeout(0)`) still races with `onBlur` when leaving the field via Tab.
 */
const yieldForFormStateCommit = async (): Promise<void> => {
	await new Promise<void>((resolve) => queueMicrotask(resolve));
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
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
			const titleInput = editProjectModalSelectors.projectTitleInput(body);
			await expect(titleInput).toHaveAttribute("aria-invalid", "true");
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

/** Moves focus so the previously focused field blurs; `userEvent.click` yields async work and pairs well with `setControlledInputValue` + `yieldForFormStateCommit`. */
export const blurActiveFieldByClickingDescription = async ({
	body,
	user,
	step,
}: {
	user: StoryUser;
} & StoryContext) => {
	await step("Move focus to Description field", async () => {
		const description = editProjectModalSelectors.descriptionTextarea(body);
		await user.click(description);
	});
};

/**
 * Ensures the title input blurs after programmatic value updates. Without an explicit
 * `.focus()` on the title field, focus can drift before `click(description)`, so blur
 * validation runs against a stale title (flake).
 */
export const blurProjectTitleInput = async ({
	body,
	user,
	step,
}: {
	user: StoryUser;
} & StoryContext) => {
	await step("Blur Project Title input", async () => {
		const titleInput = editProjectModalSelectors.projectTitleInput(body);
		(titleInput as HTMLElement).focus();
		const description = editProjectModalSelectors.descriptionTextarea(body);
		await user.click(description);
		await yieldForFormStateCommit();
	});
};

export const focusProjectTitleInput = async ({
	body,
	user,
	step,
}: {
	user: StoryUser;
} & StoryContext) => {
	await step("Focus Project Title input", async () => {
		const titleInput = editProjectModalSelectors.projectTitleInput(body);
		await user.click(titleInput);
	});
};

/**
 * After programmatic `setControlledInputValue`, Tab can still blur before TanStack commits.
 * Clicking another field matches real usage and schedules blur after user-event’s microtasks.
 */
export const blurProjectDirInput = async ({
	body,
	user,
	step,
}: {
	user: StoryUser;
} & StoryContext) => {
	await step("Blur Project Directory input", async () => {
		const projectDirInput = editProjectModalSelectors.projectDirInput(body);
		(projectDirInput as HTMLElement).focus();
		const description = editProjectModalSelectors.descriptionTextarea(body);
		await user.click(description);
	});
};
