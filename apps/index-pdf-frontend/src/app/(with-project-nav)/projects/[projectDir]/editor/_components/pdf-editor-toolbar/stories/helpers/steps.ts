import type { StorybookCanvas, StoryStep } from "@pubint/yaboujee/_stories";
import { expect, type fn, userEvent, waitFor, within } from "@storybook/test";
import { pdfEditorToolbarSelectors } from "./selectors";

type StoryFnMock = ReturnType<typeof fn>;

export const clickSelectTextAndExpectCall = async ({
	canvas,
	step,
	onSelectText,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
	onSelectText: StoryFnMock;
}) => {
	onSelectText.mockClear();
	await step("Click Select Text button", async () => {
		await userEvent.click(pdfEditorToolbarSelectors.selectTextButton(canvas));
		await expect(onSelectText).toHaveBeenCalledTimes(1);
	});
};

export const clickDrawRegionAndExpectCall = async ({
	canvas,
	step,
	onDrawRegion,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
	onDrawRegion: StoryFnMock;
}) => {
	onDrawRegion.mockClear();
	await step("Click Draw Region button", async () => {
		await userEvent.click(pdfEditorToolbarSelectors.drawRegionButton(canvas));
		await expect(onDrawRegion).toHaveBeenCalledTimes(1);
	});
};

export const openTypeDropdownAndSelectSubject = async ({
	canvas,
	step,
	onTypeChange,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
	onTypeChange: StoryFnMock;
}) => {
	const body = within(document.body);
	onTypeChange.mockClear();

	await step("Open type dropdown", async () => {
		await userEvent.click(pdfEditorToolbarSelectors.typeCombobox(canvas));
		await waitFor(
			async () => {
				const dropdown = body.queryByRole("option", { name: /subject/i });
				await expect(dropdown).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	await step("Select Subject from dropdown", async () => {
		await userEvent.click(pdfEditorToolbarSelectors.subjectOption(body));
		await expect(onTypeChange).toHaveBeenCalledWith("subject");
	});
};

export const expectSelectTextVisuallyDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	await step("Verify Select Text button is disabled (visually)", async () => {
		const selectTextButton = pdfEditorToolbarSelectors.selectTextButton(canvas);
		await expect(selectTextButton).toHaveClass(/opacity-50/);
		await expect(selectTextButton).toHaveClass(/cursor-not-allowed/);
	});
};

export const expectRegionTypesDisabledWhenSelectTextActive = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryStep;
}) => {
	const body = within(document.body);

	await step("Open type dropdown", async () => {
		await userEvent.click(pdfEditorToolbarSelectors.typeCombobox(canvas));
		await waitFor(
			async () => {
				const dropdown = body.queryByRole("option", { name: /subject/i });
				await expect(dropdown).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	await step("Verify Page Number and Exclude are disabled", async () => {
		const pageNumberOption = pdfEditorToolbarSelectors.pageNumberOption(body);
		const excludeOption = pdfEditorToolbarSelectors.excludeOption(body);

		await expect(pageNumberOption).toHaveAttribute("aria-disabled", "true");
		await expect(excludeOption).toHaveAttribute("aria-disabled", "true");
	});

	await step("Verify Subject is enabled", async () => {
		const subjectOption = pdfEditorToolbarSelectors.subjectOption(body);
		await expect(subjectOption).not.toHaveAttribute("aria-disabled", "true");
	});
};
