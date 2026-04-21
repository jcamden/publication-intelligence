import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { pdfViewerToolbarSelectors } from "./selectors";

export const clickNextThenPreviousPage = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click next page then previous page", async () => {
		const next = pdfViewerToolbarSelectors.clickableNextPage(canvas);
		const prev = pdfViewerToolbarSelectors.clickablePreviousPage(canvas);
		const pageInput = pdfViewerToolbarSelectors.currentPageInput(canvas);
		await user.click(next);
		await expect(pageInput).toHaveValue(6);
		await user.click(prev);
		await expect(pageInput).toHaveValue(5);
	});
};

export const typePageBlurToCommit = async ({
	canvas,
	user,
	value,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	value: string;
	step: StoryContext["step"];
}) => {
	await step("Clear page field, type value, blur to commit", async () => {
		const pageInput = pdfViewerToolbarSelectors.currentPageInput(canvas);
		await user.clear(pageInput);
		await user.type(pageInput, value);
		await expect(pageInput).toHaveValue(Number(value));
		await user.tab();
		await expect(pageInput).toHaveValue(Number(value));
	});
};

export const typePageEnterToCommit = async ({
	canvas,
	user,
	valueWithEnter,
	expectedValue,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	valueWithEnter: string;
	expectedValue: number;
	step: StoryContext["step"];
}) => {
	await step("Clear page field, type value with Enter", async () => {
		const pageInput = pdfViewerToolbarSelectors.currentPageInput(canvas);
		await user.clear(pageInput);
		await user.type(pageInput, valueWithEnter);
		await expect(pageInput).toHaveValue(expectedValue);
	});
};

export const typeInvalidPageBlurResets = async ({
	canvas,
	user,
	invalidValue,
	expectedAfterBlur,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	invalidValue: string;
	expectedAfterBlur: number;
	step: StoryContext["step"];
}) => {
	await step("Invalid page value resets after blur", async () => {
		const pageInput = pdfViewerToolbarSelectors.currentPageInput(canvas);
		await user.clear(pageInput);
		await user.type(pageInput, invalidValue);
		await user.tab();
		await expect(pageInput).toHaveValue(expectedAfterBlur);
	});
};

export const zoomInThenOut = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Zoom in then zoom out updates percentage field", async () => {
		const zoomIn = pdfViewerToolbarSelectors.clickableZoomIn(canvas);
		const zoomOut = pdfViewerToolbarSelectors.clickableZoomOut(canvas);
		const zoomInput = pdfViewerToolbarSelectors.zoomPercentageInput(canvas);
		await user.click(zoomIn);
		await expect(zoomInput).toHaveValue(150);
		await user.click(zoomOut);
		await expect(zoomInput).toHaveValue(125);
	});
};

export const typeZoomEnterToCommit = async ({
	canvas,
	user,
	valueWithEnter,
	expectedValue,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	valueWithEnter: string;
	expectedValue: number;
	step: StoryContext["step"];
}) => {
	await step("Clear zoom field, type percent with Enter", async () => {
		const zoomInput = pdfViewerToolbarSelectors.zoomPercentageInput(canvas);
		await user.clear(zoomInput);
		await user.type(zoomInput, valueWithEnter);
		await expect(zoomInput).toHaveValue(expectedValue);
	});
};

export const typeInvalidZoomBlurResets = async ({
	canvas,
	user,
	invalidValue,
	expectedAfterBlur,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	invalidValue: string;
	expectedAfterBlur: number;
	step: StoryContext["step"];
}) => {
	await step("Invalid zoom value resets after blur", async () => {
		const zoomInput = pdfViewerToolbarSelectors.zoomPercentageInput(canvas);
		await user.clear(zoomInput);
		await user.type(zoomInput, invalidValue);
		await user.tab();
		await expect(zoomInput).toHaveValue(expectedAfterBlur);
	});
};

export const boundaryControlsAreDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Previous page and zoom out controls are disabled", async () => {
		const prev = pdfViewerToolbarSelectors.previousPageControl(canvas);
		const zoomOut = pdfViewerToolbarSelectors.zoomOutControl(canvas);
		await expect(prev).toBeDisabled();
		await expect(zoomOut).toBeDisabled();
	});
};
