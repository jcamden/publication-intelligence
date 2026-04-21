import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { pdfFileUploadSelectors } from "./selectors";

export const callbackStatusShows = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step(`Callback status shows ${expected}`, async () => {
		await expect(
			pdfFileUploadSelectors.callbackStatus(canvas),
		).toHaveTextContent(expected);
	});
};

export const uploadContainerShowsFileName = async ({
	canvas,
	fileName,
	step,
}: {
	canvas: StorybookCanvas;
	fileName: string;
	step: StoryContext["step"];
}) => {
	await step(`Upload container includes ${fileName}`, async () => {
		const container = pdfFileUploadSelectors.uploadContainer(canvas);
		await expect(container).toHaveTextContent(fileName);
	});
};

export const clickClearUploadButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click clear upload button", async () => {
		const clear = pdfFileUploadSelectors.clearButton(canvas);
		await user.click(clear);
	});
};

export const uploadContainerDoesNotShowFileName = async ({
	canvas,
	fileName,
	step,
}: {
	canvas: StorybookCanvas;
	fileName: string;
	step: StoryContext["step"];
}) => {
	await step(`Upload container does not include ${fileName}`, async () => {
		const container = pdfFileUploadSelectors.uploadContainer(canvas);
		await expect(container).not.toHaveTextContent(fileName);
	});
};

export const clearButtonIsDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Clear upload button is disabled", async () => {
		const clear = pdfFileUploadSelectors.clearButton(canvas);
		await expect(clear).toBeDisabled();
	});
};

export const errorMessageIsVisible = async ({
	canvas,
	text,
	step,
}: {
	canvas: StorybookCanvas;
	text: string;
	step: StoryContext["step"];
}) => {
	await step("Error message is visible", async () => {
		const message = pdfFileUploadSelectors.errorText(canvas, text);
		await expect(message).toBeVisible();
	});
};
