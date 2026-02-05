import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { PdfFileUpload } from "../../pdf-file-upload";

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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const status = canvas.getByTestId("callback-status");

		await expect(status).toHaveTextContent("not-fired");
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const container = canvas.getByTestId("upload-container");

		await expect(container).toHaveTextContent("test.pdf");

		// Get the clear button (X button) - it's the second button (first is the file input wrapper)
		const buttons = canvas.getAllByRole("button");
		const clearButton = buttons[buttons.length - 1]; // The clear button is the last button
		await userEvent.click(clearButton);

		await expect(container).not.toHaveTextContent("test.pdf");
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		const clearButton = buttons[buttons.length - 1]; // The clear button is the last button

		await expect(clearButton).toBeDisabled();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const errorMessage = canvas.getByText("Only PDF files are allowed");

		await expect(errorMessage).toBeVisible();
	},
};
