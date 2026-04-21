import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { entryCreationModalSelectors } from "./selectors";

const storyBody = (): StorybookCanvas => within(document.body);

export const createTopLevelEntry = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();
	await step("Fill label field", async () => {
		await userEvent.type(
			entryCreationModalSelectors.labelInput(body),
			"New Entry",
		);
	});

	await step("Click create button", async () => {
		await userEvent.click(entryCreationModalSelectors.createButton(body));
	});
};

export const validateUniqueLabelUnderSameParent = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();

	await step("Wait for modal to be fully rendered", async () => {
		await waitFor(
			() => {
				const modal = entryCreationModalSelectors.dialog(body);
				expect(modal).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
		await waitMs({ ms: 200, step });
	});

	await step("Enter existing top-level label without parent", async () => {
		await userEvent.type(
			entryCreationModalSelectors.labelInput(body),
			"Philosophy",
		);
	});

	await step("Submit form and verify error appears", async () => {
		await userEvent.click(entryCreationModalSelectors.createButton(body));

		await waitFor(
			async () => {
				const alert = entryCreationModalSelectors.validationAlert(body);
				await expect(alert).toHaveTextContent(
					/already exists under this parent/i,
				);
			},
			{ timeout: 5000, interval: 50 },
		);
	});
};

export const allowSameLabelUnderDifferentParent = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();

	await step("Wait for modal to be fully rendered", async () => {
		await waitFor(
			() => {
				const modal = entryCreationModalSelectors.dialog(body);
				expect(modal).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
		await waitMs({ ms: 200, step });
	});

	await step(
		"Select different parent (Science instead of Philosophy)",
		async () => {
			const parentInput = entryCreationModalSelectors.parentEntryInput(body);
			await userEvent.click(parentInput);

			await waitFor(
				async () => {
					const options = body.queryAllByRole("option");
					await expect(options.length).toBeGreaterThan(0);
				},
				{ timeout: 2000 },
			);

			const options = body.getAllByRole("option");
			const scienceOption = options.find(
				(opt: HTMLElement) => opt.textContent === "Science",
			);
			if (!scienceOption) {
				throw new Error("Science option not found");
			}

			(scienceOption as HTMLElement).click();
			await waitMs({ ms: 500, step });
		},
	);

	await step(
		"Submit form should succeed without validation error",
		async () => {
			await userEvent.click(entryCreationModalSelectors.createButton(body));
			await waitMs({ ms: 500, step });

			const alerts = body.queryAllByRole("alert");
			const hasValidationError = alerts.some((alert: HTMLElement) =>
				alert.textContent?.includes("already exists"),
			);
			await expect(hasValidationError).toBe(false);
		},
	);
};

export const createEntryWithParent = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();

	await step("Fill label field", async () => {
		await userEvent.type(
			entryCreationModalSelectors.labelInput(body),
			"Epistemology",
		);
	});

	await step("Select parent entry", async () => {
		const parentInput = entryCreationModalSelectors.parentEntryInput(body);
		await userEvent.click(parentInput);

		await waitFor(
			async () => {
				const options = body.queryAllByRole("option");
				await expect(options.length).toBeGreaterThan(0);
			},
			{ timeout: 2000 },
		);

		const options = body.getAllByRole("option");
		const philosophyOption = options.find(
			(opt: HTMLElement) => opt.textContent === "Philosophy",
		);
		if (!philosophyOption) {
			throw new Error("Philosophy option not found");
		}

		(philosophyOption as HTMLElement).click();
		await waitMs({ ms: 500, step });
	});

	await step("Submit form", async () => {
		await userEvent.click(entryCreationModalSelectors.createButton(body));
	});
};

export const cancelClosesModal = async ({ step }: { step: StoryStep }) => {
	const body = storyBody();

	await step("Fill some data", async () => {
		await userEvent.type(
			entryCreationModalSelectors.labelInput(body),
			"Test Entry",
		);
	});

	await step("Click cancel button", async () => {
		await userEvent.click(entryCreationModalSelectors.cancelButton(body));
	});
};

/** VRT: label + Philosophy parent selected (dropdown open then option chosen). */
export const vrtFillLabelAndSelectPhilosophyParent = async ({
	step,
}: {
	step: StoryStep;
}) => {
	const body = storyBody();

	await step("Label and Philosophy parent are set for snapshot", async () => {
		await userEvent.type(
			entryCreationModalSelectors.labelInput(body),
			"New Entry",
		);

		await userEvent.click(
			entryCreationModalSelectors.parentEntryCombobox(body),
		);

		await waitFor(
			async () => {
				await userEvent.click(
					entryCreationModalSelectors.philosophyTopLevelOption(body),
				);
			},
			{ timeout: 3000 },
		);
	});
};
