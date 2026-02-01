import { expect, userEvent, waitFor, within } from "@storybook/test";

/**
 * Shared interaction test steps for reusability across stories
 */

type Canvas = ReturnType<typeof within>;

type OpenModalParams = {
	canvas: Canvas;
	triggerLabel: string | RegExp;
	modalRole?: string;
};

export const openModal = async ({
	canvas,
	triggerLabel,
	modalRole = "dialog",
}: OpenModalParams) => {
	const trigger = canvas.getByRole("button", { name: triggerLabel });
	await userEvent.click(trigger);

	await waitFor(async () => {
		const body = within(document.body);
		const modal = body.getByRole(modalRole, { hidden: true });
		await expect(modal).toBeInTheDocument();
	});
};

type CloseModalParams = {
	closeMethod: "button" | "backdrop" | "escape";
	buttonLabel?: string | RegExp;
};

export const closeModal = async ({
	closeMethod,
	buttonLabel,
}: CloseModalParams) => {
	const body = within(document.body);

	if (closeMethod === "button" && buttonLabel) {
		const closeButton = body.getByRole("button", { name: buttonLabel });
		await userEvent.click(closeButton);
	} else if (closeMethod === "escape") {
		await userEvent.keyboard("{Escape}");
	} else if (closeMethod === "backdrop") {
		// Click backdrop (outside the modal)
		const backdrop = document.querySelector('[data-base-ui-backdrop=""]');
		if (backdrop) {
			await userEvent.click(backdrop as HTMLElement);
		}
	}

	await waitFor(async () => {
		const modal = body.queryByRole("dialog", { hidden: true });
		await expect(modal).not.toBeInTheDocument();
	});
};

type FillTextInputParams = {
	canvas: Canvas;
	label: string | RegExp;
	value: string;
};

export const fillTextInput = async ({
	canvas,
	label,
	value,
}: FillTextInputParams) => {
	const input = canvas.getByLabelText(label);
	await userEvent.clear(input);
	await userEvent.type(input, value);
};

type ClickButtonParams = {
	canvas: Canvas;
	label: string | RegExp;
};

export const clickButton = async ({ canvas, label }: ClickButtonParams) => {
	const button = canvas.getByRole("button", { name: label });
	await userEvent.click(button);
};

type ExpectValidationErrorParams = {
	canvas: Canvas;
	errorText: string | RegExp;
};

export const expectValidationError = async ({
	canvas,
	errorText,
}: ExpectValidationErrorParams) => {
	await waitFor(async () => {
		const error = canvas.getByText(errorText);
		await expect(error).toBeInTheDocument();
	});
};
