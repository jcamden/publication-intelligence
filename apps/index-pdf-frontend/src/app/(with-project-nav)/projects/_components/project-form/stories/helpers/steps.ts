import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent } from "@storybook/test";
import { projectFormSelectors } from "./selectors";

export const submitButtonDisabledWithoutFile = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Fill title; submit stays disabled without file", async () => {
		await user.type(projectFormSelectors.titleInput(canvas), "Test Project");
		await expect(projectFormSelectors.submitCreate(canvas)).toBeDisabled();
	});
};

export const autoPopulatesProjectDir = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Type title and wait for slug debounce", async () => {
		await user.type(
			projectFormSelectors.titleInput(canvas),
			"Word Biblical Commentary: Daniel (Vol. 30)",
		);
		await waitMs({ ms: 600, step });
		await expect(projectFormSelectors.projectDirInput(canvas)).toHaveValue(
			"word-biblical-commentary-daniel-vol-30",
		);
	});
};

export const manualProjectDirStopsAutoPopulation = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Manual dir then title does not overwrite dir", async () => {
		await user.type(
			projectFormSelectors.projectDirInput(canvas),
			"my-custom-dir",
		);
		await user.type(projectFormSelectors.titleInput(canvas), "Different Title");
		await waitMs({ ms: 200, step });
		await expect(projectFormSelectors.projectDirInput(canvas)).toHaveValue(
			"my-custom-dir",
		);
	});
};

export const showsDuplicateProjectDirError = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Duplicate project directory shows error", async () => {
		await user.type(
			projectFormSelectors.projectDirInput(canvas),
			"existing-project",
		);
		await user.tab();
		const error = await canvas.findByText(
			/this project directory is already in use/i,
		);
		await expect(error).toBeVisible();
	});
};

export const showsDuplicateTitleError = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Duplicate title shows error", async () => {
		await user.type(projectFormSelectors.titleInput(canvas), "test project");
		await user.tab();
		const error = await canvas.findByText(
			/a project with this title already exists/i,
		);
		await expect(error).toBeVisible();
	});
};

export const showsInvalidProjectDirError = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Invalid project directory shows error", async () => {
		await user.type(
			projectFormSelectors.projectDirInput(canvas),
			"Invalid Project Dir!",
		);
		await user.tab();
		const error = await canvas.findByText(
			/must contain only lowercase letters, numbers, and hyphens \(e\.g\., my-project\)/i,
		);
		await expect(error).toBeVisible();
	});
};

export const descriptionIsOptional = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Empty description is valid", async () => {
		await user.type(projectFormSelectors.titleInput(canvas), "Test Project");
		await user.tab();
		const descriptionInput = projectFormSelectors.descriptionInput(canvas);
		const descriptionField = descriptionInput.closest("[data-invalid]");
		if (descriptionField) {
			await expect(descriptionField).not.toHaveAttribute(
				"data-invalid",
				"true",
			);
		}
	});
};

export const editModePrePopulatesFields = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Edit mode shows initial values", async () => {
		await expect(projectFormSelectors.titleInput(canvas)).toHaveValue(
			"Existing Project Title",
		);
		await expect(projectFormSelectors.descriptionInput(canvas)).toHaveValue(
			"Existing description",
		);
		const projectDirInput = projectFormSelectors.projectDirInput(canvas);
		await expect(projectDirInput).toHaveValue("existing-project");
		await expect(projectDirInput).not.toBeDisabled();
		await expect(projectFormSelectors.submitUpdate(canvas)).toBeVisible();
	});
};

export const editModeShowsPdfThumbnail = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Source document section visible in edit mode", async () => {
		await expect(
			projectFormSelectors.sourceDocumentLabel(canvas),
		).toBeVisible();
		await expect(canvas.getByText("test-document.pdf")).toBeVisible();
		await expect(canvas.getByText("100 pages")).toBeVisible();
	});
};

export const editModeProjectDirIsEditable = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step(
		"Project directory remains editable with helper text",
		async () => {
			const projectDirInput = projectFormSelectors.projectDirInput(canvas);
			await expect(projectDirInput).not.toHaveAttribute("readonly");
			await expect(projectDirInput).not.toBeDisabled();
			await user.clear(projectDirInput);
			await user.type(projectDirInput, "updated-project");
			await expect(projectDirInput).toHaveValue("updated-project");
			await expect(projectFormSelectors.urlChangeHelper(canvas)).toBeVisible();
		},
	);
};

export const editModeSubmitButtonAlwaysEnabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Update submit enabled without new file", async () => {
		await expect(projectFormSelectors.submitUpdate(canvas)).not.toBeDisabled();
	});
};

export const editModeCanModifyTitle = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Title can change while submit stays enabled", async () => {
		const titleInput = projectFormSelectors.titleInput(canvas);
		await user.clear(titleInput);
		await user.type(titleInput, "Updated Title");
		await expect(titleInput).toHaveValue("Updated Title");
		await expect(projectFormSelectors.submitUpdate(canvas)).not.toBeDisabled();
	});
};

export const editModeAllowsSameTitleAsOriginal = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Blur title field without changing it", async () => {
		const titleInput = projectFormSelectors.titleInput(canvas);
		await expect(titleInput).toHaveValue("Original Title");
		await user.click(titleInput);
		await user.tab();
	});

	await step("Verify no duplicate error appears", async () => {
		const errorText = canvas.queryByText(
			/a project with this title already exists/i,
		);
		await expect(errorText).toBeNull();
	});
};

export const editModeBlocksDuplicateTitleFromOtherProject = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Change title to another existing project's title", async () => {
		const titleInput = projectFormSelectors.titleInput(canvas);
		await user.clear(titleInput);
		await user.type(titleInput, "Other Project");
		await user.tab();
	});

	await step("Verify duplicate error appears", async () => {
		const error = await canvas.findByText(
			/a project with this title already exists/i,
		);
		await expect(error).toBeVisible();
	});
};

export const editModeAllowsSameProjectDirAsOriginal = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Blur project_dir field without changing it", async () => {
		const projectDirInput = projectFormSelectors.projectDirInput(canvas);
		await expect(projectDirInput).toHaveValue("test-project");
		await user.click(projectDirInput);
		await user.tab();
	});

	await step("Verify no duplicate error appears", async () => {
		const errorText = canvas.queryByText(
			/this project directory is already in use/i,
		);
		await expect(errorText).toBeNull();
	});
};

/** VRT: duplicate title + directory errors visible after blur. */
export const vrtShowDuplicateTitleAndProjectDirectoryErrors = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step(
		"Duplicate title and project directory are entered for validation snapshot",
		async () => {
			await user.type(
				projectFormSelectors.titleInput(canvas),
				"Existing Project",
			);
			await user.tab();
			await user.type(
				projectFormSelectors.projectDirInput(canvas),
				"existing-project",
			);
			await user.tab();
		},
	);
};

/** VRT: filled title + description; slug debounce settled before snapshot. */
export const vrtFillTitleDescriptionAndWaitForDirectorySlug = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step("Title and description are filled for snapshot", async () => {
		await user.type(
			projectFormSelectors.titleInput(canvas),
			"Word Biblical Commentary: Daniel",
		);
		await user.type(
			projectFormSelectors.descriptionInput(canvas),
			"A comprehensive theological and exegetical analysis",
		);
	});
	await waitMs({ ms: 600, step });
};

export const editModeBlocksDuplicateProjectDirFromOtherProject = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const user = userEvent.setup();
	await step(
		"Change project_dir to another existing project's directory",
		async () => {
			const projectDirInput = projectFormSelectors.projectDirInput(canvas);
			await user.clear(projectDirInput);
			await user.type(projectDirInput, "other-project");
			await user.tab();
		},
	);

	await step("Verify duplicate error appears", async () => {
		const error = await canvas.findByText(
			/this project directory is already in use/i,
		);
		await expect(error).toBeVisible();
	});
};
