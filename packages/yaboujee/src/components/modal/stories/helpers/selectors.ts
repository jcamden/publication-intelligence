import type { StorybookCanvas } from "@pubint/yaboujee/_stories";
import { within } from "@storybook/test";

export type ModalStorySelectors = {
	body: () => StorybookCanvas;
	childContent: () => Promise<HTMLElement>;
	closeButton: () => Promise<HTMLElement>;
	closeButtons: () => HTMLElement[];
	closeCount: (canvas: StorybookCanvas) => HTMLElement;
	footerButton: () => Promise<HTMLElement>;
	modalContent: () => Promise<HTMLElement>;
	modalState: (canvas: StorybookCanvas) => HTMLElement;
	openBtn: (canvas: StorybookCanvas) => HTMLElement;
	openButton: (canvas: StorybookCanvas) => HTMLElement;
	title: (text: string) => Promise<HTMLElement>;
	triggerButton: (canvas: StorybookCanvas) => HTMLElement;
};

export const modalSelectors: ModalStorySelectors = {
	body: () => within(document.body),
	childContent: () => modalSelectors.body().findByTestId("child-content"),
	closeButton: () => modalSelectors.body().findByRole("button", { name: /✕/i }),
	closeButtons: () =>
		modalSelectors.body().queryAllByRole("button", { name: /✕/i }),
	closeCount: (canvas: StorybookCanvas) => canvas.getByTestId("close-count"),
	footerButton: () => modalSelectors.body().findByTestId("footer-button"),
	modalContent: () => modalSelectors.body().findByTestId("modal-content"),
	modalState: (canvas: StorybookCanvas) => canvas.getByTestId("modal-state"),
	openBtn: (canvas: StorybookCanvas) => canvas.getByTestId("open-btn"),
	openButton: (canvas: StorybookCanvas) => canvas.getByTestId("open-button"),
	title: (text: string) => modalSelectors.body().findByText(text),
	triggerButton: (canvas: StorybookCanvas) =>
		canvas.getByTestId("trigger-button"),
};
