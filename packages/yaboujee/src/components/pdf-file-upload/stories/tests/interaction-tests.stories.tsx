import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { PdfFileUpload } from "../../pdf-file-upload";
import {
	callbackStatusShows,
	clearButtonIsDisabled,
	clickClearUploadButton,
	errorMessageIsVisible,
	uploadContainerDoesNotShowFileName,
	uploadContainerShowsFileName,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Components/PdfFileUpload/tests/Interaction Tests",
	component: PdfFileUpload,
	parameters: {
		...defaultInteractionTestMeta.parameters,
	},
} satisfies Meta<typeof PdfFileUpload>;

export const FileUploadTriggersCallback: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const [selectedFile, setSelectedFile] = useState<File | undefined>();
		const [callbackFired, setCallbackFired] = useState(false);

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={(file) => {
						setSelectedFile(file);
						setCallbackFired(true);
					}}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
				/>
				<div data-testid="callback-status">
					{callbackFired ? "fired" : "not-fired"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await callbackStatusShows({ canvas, expected: "not-fired", step });
	},
};

export const ClearButtonRemovesFile: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const mockFile = new File(["test content"], "test.pdf", {
			type: "application/pdf",
		});
		const [selectedFile, setSelectedFile] = useState<File | undefined>(
			mockFile,
		);

		return (
			<div className="w-[400px]" data-testid="upload-container">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await uploadContainerShowsFileName({ canvas, fileName: "test.pdf", step });
		await clickClearUploadButton({ canvas, user, step });
		await uploadContainerDoesNotShowFileName({
			canvas,
			fileName: "test.pdf",
			step,
		});
	},
};

export const DisabledStatePreventsClear: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const mockFile = new File(["test content"], "test.pdf", {
			type: "application/pdf",
		});
		const [selectedFile, setSelectedFile] = useState<File | undefined>(
			mockFile,
		);

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
					disabled
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await clearButtonIsDisabled({ canvas, step });
	},
};

export const DisplaysErrorMessage: StoryObj<typeof PdfFileUpload> = {
	render: () => {
		const [selectedFile, setSelectedFile] = useState<File | undefined>();

		return (
			<div className="w-[400px]">
				<PdfFileUpload
					onFileSelect={setSelectedFile}
					onClear={() => setSelectedFile(undefined)}
					selectedFile={selectedFile}
					error="Only PDF files are allowed"
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await errorMessageIsVisible({
			canvas,
			text: "Only PDF files are allowed",
			step,
		});
	},
};
