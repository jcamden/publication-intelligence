import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { waitMs } from "@pubint/yaboujee/_stories";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { mentionCreationSelectors } from "./selectors";

const body = (): StorybookCanvas => within(document.body);

export const selectExistingEntry = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search for top-level entry", async () => {
		const input = mentionCreationSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.clear(input);
		await userEvent.type(input, "Philo", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Select 'Philosophy' entry", async () => {
		const b = body();
		await waitFor(
			async () => {
				const options = b.queryAllByRole("option");
				await expect(options.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 },
		);

		const philosophyOption = b.getByRole("option", { name: "Philosophy" });
		(philosophyOption as HTMLElement).click();
		await waitMs({ ms: 300, step });
	});

	await step("Click Attach button", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
	});

	await step("Verify mention was attached", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(
			() => {
				expect(result).toHaveTextContent(/Attached: Philosophy/);
			},
			{ timeout: 2000 },
		);
	});
};

export const tryToSubmitWithoutSelection = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Type non-existent entry name", async () => {
		const input = mentionCreationSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.type(input, "Heidegger", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Close dropdown by pressing Escape", async () => {
		await userEvent.keyboard("{Escape}");
		await waitMs({ ms: 300, step });
	});

	await step("Try to attach without selecting", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
		await waitMs({ ms: 300, step });
	});

	await step("Verify validation error appears", async () => {
		await waitFor(
			async () => {
				const errorMessage = canvas.getByText(
					/Please select or create an entry/i,
				);
				await expect(errorMessage).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});
};

export const cancelWithButton = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Close dropdown so form is not inert", async () => {
		await userEvent.keyboard("{Escape}");
		await waitMs({ ms: 200, step });
	});

	await step("Click cancel button", async () => {
		await userEvent.click(mentionCreationSelectors.cancelButton(canvas));
	});

	await step("Verify cancellation", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(() => {
			expect(result).toHaveTextContent("Cancelled");
		});
	});
};

export const cancelWithEscape = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Press Escape to close dropdown then cancel popover", async () => {
		await userEvent.keyboard("{Escape}");
		await waitMs({ ms: 100, step });
		await userEvent.keyboard("{Escape}");
	});

	await step("Verify cancellation", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(() => {
			expect(result).toHaveTextContent("Cancelled");
		});
	});
};

export const searchWithNoResults = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search for non-existent entry", async () => {
		const input = mentionCreationSelectors.entryPlaceholder(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.clear(input);
		await userEvent.type(input, "Zzzzz");
		await waitMs({ ms: 500, step });
	});

	await step("Verify empty state message", async () => {
		const b = body();
		await waitFor(async () => {
			const emptyMessage = b.getByText(/No entries found/i);
			await expect(emptyMessage).toBeInTheDocument();
		});
	});
};

export const selectNestedEntry = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const b = body();

	await step("Open dropdown and search for Science", async () => {
		const input = mentionCreationSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.clear(input);
		await userEvent.type(input, "Science", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Select Science entry using native DOM click", async () => {
		await waitFor(
			async () => {
				const options = b.queryAllByRole("option");
				await expect(options.length).toBeGreaterThan(0);
			},
			{ timeout: 2000 },
		);

		const options = b.getAllByRole("option");
		const scienceOption = options.find((opt: HTMLElement) =>
			opt.textContent?.includes("Science"),
		);
		if (!scienceOption) {
			throw new Error("Science option not found");
		}

		(scienceOption as HTMLElement).click();
		await waitMs({ ms: 500, step });
	});

	await step("Click Attach button", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
	});

	await step("Verify mention was attached", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(
			() => {
				expect(result).toHaveTextContent(/Attached: Science/);
			},
			{ timeout: 3000 },
		);
	});
};

export const smartAutocompleteExactMatch = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify exact match auto-populated and pre-selected", async () => {
		await waitFor(
			() => {
				const input = mentionCreationSelectors.combobox(canvas);
				const value = (input as HTMLInputElement).value;
				expect(value).toContain("Science");
			},
			{ timeout: 2000 },
		);
	});

	await step("Click Attach button", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
	});

	await step("Verify mention was attached", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(
			() => {
				expect(result).toHaveTextContent(/Attached: Science/);
			},
			{ timeout: 2000 },
		);
	});
};

export const createRegionMention = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Click region name input to ensure focus", async () => {
		const regionNameInput = mentionCreationSelectors.regionNameInput(canvas);
		await userEvent.click(regionNameInput);
		await waitMs({ ms: 200, step });
	});

	await step("Enter region name", async () => {
		const regionNameInput = mentionCreationSelectors.regionNameInput(canvas);
		await userEvent.type(regionNameInput, "Introduction Section", {
			delay: 50,
		});
	});

	await step("Search for entry in combobox", async () => {
		const entryInput = mentionCreationSelectors.entryPlaceholder(canvas);
		await userEvent.click(entryInput);
		await waitMs({ ms: 200, step });
		await userEvent.type(entryInput, "Philosophy", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Select entry using keyboard", async () => {
		await waitFor(
			async () => {
				const options = body().queryAllByRole("option");
				await expect(options.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 },
		);

		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard("{Enter}");

		await waitFor(
			() => {
				const attachButton = mentionCreationSelectors.attachButton(canvas);
				expect(attachButton).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	await step("Click Attach button", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
	});

	await step(
		"Verify region mention was attached with region name",
		async () => {
			const result = mentionCreationSelectors.result(canvas);
			await waitFor(
				() => {
					expect(result).toHaveTextContent(/Attached: Philosophy/);
					expect(result).toHaveTextContent(/Region: Introduction Section/);
				},
				{ timeout: 2000 },
			);
		},
	);
};

/** VRT: partial search so filtered results are visible before snapshot. */
export const vrtSearchPartialPhilInMentionPicker = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Search text narrows entry list for snapshot", async () => {
		const input = mentionCreationSelectors.searchOrCreateInput(canvas);
		await userEvent.clear(input);
		await userEvent.type(input, "Phil", { delay: 10 });
	});
	await waitMs({ ms: 300, step });
};

/** VRT: no-match search for empty-state snapshot. */
export const vrtSearchNonexistentInMentionPicker = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Non-matching search text is entered for snapshot", async () => {
		const input = mentionCreationSelectors.searchOrCreateInput(canvas);
		await userEvent.clear(input);
		await userEvent.type(input, "Nonexistent", { delay: 10 });
	});
	await waitMs({ ms: 300, step });
};

export const createNewEntryFromPicker = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const b = body();

	await step("Wait for story to be ready", async () => {
		await waitFor(
			() => {
				expect(mentionCreationSelectors.combobox(canvas)).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
	});

	await step("Search for non-existent entry", async () => {
		const input = mentionCreationSelectors.combobox(canvas);
		await userEvent.click(input);
		await waitMs({ ms: 300, step });
		await userEvent.clear(input);
		await userEvent.type(input, "Heidegger", { delay: 50 });
		await waitMs({ ms: 500, step });
	});

	await step("Verify 'Create new entry' button appears", async () => {
		await waitFor(
			async () => {
				const createButton = mentionCreationSelectors.createNewEntryButton(
					b,
					/Create new entry.*Heidegger/i,
				);
				await expect(createButton).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
	});

	await step("Click 'Create new entry' button", async () => {
		const createButton = mentionCreationSelectors.createNewEntryButton(
			b,
			/Create new entry.*Heidegger/i,
		);
		(createButton as HTMLElement).click();
		await waitMs({ ms: 500, step });
	});

	await step("Verify EntryCreationModal opens", async () => {
		await waitFor(
			async () => {
				const modal = mentionCreationSelectors.entryCreationModal(b);
				await expect(modal).toBeInTheDocument();
				await expect(
					mentionCreationSelectors.modalTitle(b),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	await step("Verify label is pre-filled", async () => {
		const labelInput = mentionCreationSelectors.labelInput(b);
		await waitFor(() => {
			expect((labelInput as HTMLInputElement).value).toBe("Heidegger");
		});
	});

	await step("Submit entry creation form", async () => {
		await userEvent.click(mentionCreationSelectors.modalCreateButton(b));
		await waitMs({ ms: 1000, step });
	});

	await step("Verify new entry is auto-selected", async () => {
		await waitFor(
			async () => {
				const input = mentionCreationSelectors.combobox(canvas);
				const value = (input as HTMLInputElement).value;
				await expect(value).toContain("Heidegger");
			},
			{ timeout: 3000 },
		);
	});

	await step("Complete the attachment", async () => {
		await userEvent.click(mentionCreationSelectors.attachButton(canvas));
	});

	await step("Verify mention was attached with new entry", async () => {
		const result = mentionCreationSelectors.result(canvas);
		await waitFor(
			() => {
				expect(result).toHaveTextContent(/Attached: Heidegger/);
			},
			{ timeout: 2000 },
		);
	});
};
