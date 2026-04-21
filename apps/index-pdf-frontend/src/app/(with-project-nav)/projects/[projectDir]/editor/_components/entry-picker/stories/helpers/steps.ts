import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { entryPickerSelectors } from "./selectors";

const body = (): StorybookCanvas => within(document.body);

export const showCreateButtonWhenNoResults = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search for non-existent entry", async () => {
		const input = entryPickerSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.type(input, "Nonexistent Entry", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Verify 'Create new entry' button appears", async () => {
		await waitFor(
			async () => {
				const createButton = entryPickerSelectors.createNewEntryButton(
					body(),
					/Create new entry: "Nonexistent Entry"/i,
				);
				await expect(createButton).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
};

export const createTopLevelEntry = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search for non-existent top-level entry", async () => {
		const input = entryPickerSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.type(input, "New Topic", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Click 'Create new entry' button", async () => {
		const createButton = entryPickerSelectors.createNewEntryButton(
			body(),
			/Create new entry: "New Topic"/i,
		);
		(createButton as HTMLElement).click();
		await waitMs({ ms: 500, step });
	});

	await step(
		"Verify create callback was called with correct params",
		async () => {
			const result = entryPickerSelectors.result(canvas);
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Create requested: New Topic/);
					expect(result).toHaveTextContent(/parent: none/);
				},
				{ timeout: 5000 },
			);
		},
	);
};

export const createNestedEntry = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Navigate into Philosophy:", async () => {
		const input = entryPickerSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.type(input, "Philosophy:", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Search for non-existent nested entry", async () => {
		const input = entryPickerSelectors.combobox(canvas);
		await userEvent.type(input, "Phenomenology", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Verify 'Create new entry' button appears", async () => {
		await waitFor(
			async () => {
				const createButton = entryPickerSelectors.createNewEntryButton(
					body(),
					/Create new entry: "Phenomenology"/i,
				);
				await expect(createButton).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	await step("Click 'Create new entry' button", async () => {
		const createButton = entryPickerSelectors.createNewEntryButton(
			body(),
			/Create new entry: "Phenomenology"/i,
		);
		(createButton as HTMLElement).click();
		await waitMs({ ms: 500, step });
	});

	await step("Verify create callback includes parent ID", async () => {
		const result = entryPickerSelectors.result(canvas);
		await waitFor(
			() => {
				expect(result).toHaveTextContent(/Create requested: Phenomenology/);
				expect(result).not.toHaveTextContent(/parent: none/);
			},
			{ timeout: 5000 },
		);
	});
};

export const noCreateButtonWhenDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search for non-existent entry", async () => {
		const input = entryPickerSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.type(input, "Nonexistent", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Verify only empty state message appears", async () => {
		await waitFor(
			async () => {
				const emptyMessage = entryPickerSelectors.emptyStateMessage(body());
				await expect(emptyMessage).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		const createButton = body().queryByRole("button", {
			name: /Create new entry/i,
		});
		await expect(createButton).not.toBeInTheDocument();
	});
};
