import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent } from "@storybook/test";
import { mentionDetailsSelectors } from "./selectors";

const clickEdit = async (canvas: StorybookCanvas) => {
	await userEvent.click(mentionDetailsSelectors.editButton(canvas));
};

export const viewModeDefault = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify View mode displays read-only fields", async () => {
		await expect(canvas.getByText(/sample text/i)).toBeInTheDocument();
		await expect(
			canvas.getByText(/kant → critique of pure reason/i),
		).toBeInTheDocument();
	});

	await step("Verify Edit and Close buttons are visible", async () => {
		await expect(
			mentionDetailsSelectors.editButton(canvas),
		).toBeInTheDocument();
		await expect(
			mentionDetailsSelectors.closeButton(canvas),
		).toBeInTheDocument();
	});

	await step(
		"Verify editable fields are not present in view mode",
		async () => {
			await expect(
				canvas.queryByTestId("entry-combobox"),
			).not.toBeInTheDocument();
		},
	);
};

export const enterEditMode = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Click Edit button", async () => {
		await clickEdit(canvas);
	});

	await step("Verify Edit mode UI is displayed", async () => {
		await expect(
			mentionDetailsSelectors.entryCombobox(canvas),
		).toBeInTheDocument();
	});

	await step("Verify Edit mode buttons are visible", async () => {
		await expect(
			mentionDetailsSelectors.deleteButton(canvas),
		).toBeInTheDocument();
		await expect(
			mentionDetailsSelectors.cancelButton(canvas),
		).toBeInTheDocument();
		await expect(
			mentionDetailsSelectors.saveButton(canvas),
		).toBeInTheDocument();
	});
};

export const cancelEditMode = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Enter Edit mode", async () => {
		await clickEdit(canvas);
	});

	await step("Click Cancel button", async () => {
		await userEvent.click(mentionDetailsSelectors.cancelButton(canvas));
	});

	await step("Verify returned to View mode", async () => {
		await expect(
			mentionDetailsSelectors.editButton(canvas),
		).toBeInTheDocument();
		await expect(
			mentionDetailsSelectors.closeButton(canvas),
		).toBeInTheDocument();
	});
};

export const saveChanges = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Enter Edit mode", async () => {
		await clickEdit(canvas);
	});

	await step("Change page sublocation", async () => {
		const sublocationInput = mentionDetailsSelectors.sublocationInput(canvas);
		await userEvent.clear(sublocationInput);
		await userEvent.type(sublocationInput, "10:45.a");
	});

	await step("Click Save button", async () => {
		await userEvent.click(mentionDetailsSelectors.saveButton(canvas));
	});

	await step("Verify returned to View mode", async () => {
		await expect(
			mentionDetailsSelectors.editButton(canvas),
		).toBeInTheDocument();
	});
};

export const editRegionText = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Enter Edit mode", async () => {
		await clickEdit(canvas);
	});

	await step("Verify region text input is editable", async () => {
		const textInput = mentionDetailsSelectors.regionTextInput(canvas);
		await expect(textInput).toBeInTheDocument();
		await expect(textInput).toHaveValue("Original region description");
	});

	await step("Edit region text", async () => {
		const textInput = mentionDetailsSelectors.regionTextInput(
			canvas,
		) as HTMLInputElement;
		await userEvent.clear(textInput);
		await userEvent.type(textInput, "Updated region description");
	});

	await step("Verify text was updated", async () => {
		const textInput = mentionDetailsSelectors.regionTextInput(
			canvas,
		) as HTMLInputElement;
		await expect(textInput).toHaveValue("Updated region description");
	});
};

export const textTypeReadonly = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Enter Edit mode", async () => {
		await clickEdit(canvas);
	});

	await step("Verify text type is readonly (no input field)", async () => {
		await expect(
			canvas.queryByTestId("region-text-input"),
		).not.toBeInTheDocument();
		await expect(
			canvas.getByText(/extracted text from pdf/i),
		).toBeInTheDocument();
	});
};

export const closeButtonClick = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Click Close button", async () => {
		await userEvent.click(mentionDetailsSelectors.closeButton(canvas));
	});
};

export const deleteInEditMode = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Enter Edit mode", async () => {
		await clickEdit(canvas);
	});

	await step("Click Delete button", async () => {
		await userEvent.click(mentionDetailsSelectors.deleteButton(canvas));
	});
};

export const displaysCorrectInformation = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify text is displayed", async () => {
		await expect(
			canvas.getByText(/this is the highlighted text/i),
		).toBeInTheDocument();
	});

	await step("Verify entry label is displayed", async () => {
		await expect(canvas.getByText(/plato → the republic/i)).toBeInTheDocument();
	});
};

export const truncatesLongText = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify text is truncated with ellipsis", async () => {
		const textElement = canvas.getByText(/this is a very long text/i);
		await expect(textElement.textContent).toMatch(/\.\.\./);
	});
};

/** VRT: pause before snapshot when pseudo-hover needs layout to settle. */
export const vrtPauseForPseudoHoverSnapshot = async ({
	step,
}: {
	step: StoryStep;
}) => {
	await waitMs({ ms: 300, step });
};

/** VRT: edit mode open; short pause before snapshot. */
export const vrtOpenEditModeForSnapshot = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Edit mode is opened for snapshot", async () => {
		await userEvent.click(mentionDetailsSelectors.editButton(canvas));
	});
	await waitMs({ ms: 100, step });
};
