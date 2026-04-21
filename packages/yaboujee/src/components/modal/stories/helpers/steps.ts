import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { modalSelectors } from "./selectors";

export const openModalByClickingOpenButton = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click Open button", async () => {
		const openButton = modalSelectors.openButton(canvas);
		await expect(openButton).toBeVisible();
		await user.click(openButton);
	});
};

export const modalContentIsVisible = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Modal content is visible", async () => {
		const modalContent = await modalSelectors.modalContent();
		await expect(modalContent).toBeVisible();
	});
};

export const triggerModalOpenAndClose = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Modal state shows closed", async () => {
		const stateDisplay = modalSelectors.modalState(canvas);
		await expect(stateDisplay).toHaveTextContent("closed");
	});

	await step("Click trigger button", async () => {
		const triggerButton = modalSelectors.triggerButton(canvas);
		await user.click(triggerButton);
	});

	await step("Modal state shows open", async () => {
		const stateDisplay = modalSelectors.modalState(canvas);
		await expect(stateDisplay).toHaveTextContent("open");
	});

	await step("Click close button", async () => {
		const closeButton = await modalSelectors.closeButton();
		await user.click(closeButton);
	});

	await step("Modal state shows closed", async () => {
		const stateDisplay = modalSelectors.modalState(canvas);
		await expect(stateDisplay).toHaveTextContent("closed");
	});
};

export const modalTitleIsVisible = async ({
	title,
	step,
}: {
	title: string;
	step: StoryContext["step"];
}) => {
	await step("Modal title is visible", async () => {
		const titleEl = await modalSelectors.title(title);
		await waitFor(async () => expect(titleEl).toBeVisible(), { timeout: 500 });
	});
};

export const modalChildContentIsVisible = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Modal child content is visible", async () => {
		const content = await modalSelectors.childContent();
		await waitFor(async () => expect(content).toBeVisible(), { timeout: 500 });
		await expect(content).toHaveTextContent("This is the modal content");
	});
};

export const modalFooterIsVisible = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Modal footer is visible", async () => {
		const footerButton = await modalSelectors.footerButton();
		await waitFor(async () => expect(footerButton).toBeVisible(), {
			timeout: 500,
		});
		await expect(footerButton).toHaveTextContent("Action");
	});
};

export const noCloseButtonIsVisible = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("No close button is visible", async () => {
		const closeButtons = modalSelectors.closeButtons();
		await expect(closeButtons.length).toBe(0);
	});
};

export const closeCallbackIsCalledOnce = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Close count is 0", async () => {
		const closeCount = modalSelectors.closeCount(canvas);
		await expect(closeCount).toHaveTextContent("0");
	});

	await step("Click Open Modal button", async () => {
		const openBtn = modalSelectors.openBtn(canvas);
		await user.click(openBtn);
	});

	await step("Click close button", async () => {
		const closeButton = await modalSelectors.closeButton();
		await user.click(closeButton);
	});

	await step("Close count is 1", async () => {
		const closeCount = modalSelectors.closeCount(canvas);
		await expect(closeCount).toHaveTextContent("1");
	});
};
