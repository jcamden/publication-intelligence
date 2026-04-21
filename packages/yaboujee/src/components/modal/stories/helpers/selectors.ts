import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type ModalStorySelectors = {
	openButton: (canvas: StorybookCanvas) => HTMLElement;
	triggerButton: (canvas: StorybookCanvas) => HTMLElement;
	modalState: (canvas: StorybookCanvas) => HTMLElement;
	body: () => StorybookCanvas;
	modalContent: () => Promise<HTMLElement>;
	closeButton: () => Promise<HTMLElement>;
	title: (text: string) => Promise<HTMLElement>;
	childContent: () => Promise<HTMLElement>;
	footerButton: () => Promise<HTMLElement>;
	closeButtons: () => HTMLElement[];
	openBtn: (canvas: StorybookCanvas) => HTMLElement;
	closeCount: (canvas: StorybookCanvas) => HTMLElement;
};

export const modalSelectors: ModalStorySelectors = {
	openButton: (canvas: StorybookCanvas) => canvas.getByTestId("open-button"),
	triggerButton: (canvas: StorybookCanvas) =>
		canvas.getByTestId("trigger-button"),
	modalState: (canvas: StorybookCanvas) => canvas.getByTestId("modal-state"),

	body: () => within(document.body),
	modalContent: () => modalSelectors.body().findByTestId("modal-content"),
	closeButton: () => modalSelectors.body().findByRole("button", { name: /✕/i }),
	title: (text: string) => modalSelectors.body().findByText(text),
	childContent: () => modalSelectors.body().findByTestId("child-content"),
	footerButton: () => modalSelectors.body().findByTestId("footer-button"),
	closeButtons: () =>
		modalSelectors.body().queryAllByRole("button", { name: /✕/i }),
	openBtn: (canvas: StorybookCanvas) => canvas.getByTestId("open-btn"),
	closeCount: (canvas: StorybookCanvas) => canvas.getByTestId("close-count"),
};
