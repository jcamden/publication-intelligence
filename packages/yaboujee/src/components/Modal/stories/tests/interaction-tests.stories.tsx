import { interactionTestConfig } from "@pubint/storybook-config";
import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { Modal } from "../../modal";

export default {
	title: "Components/Modal/tests/Interaction Tests",
	component: Modal,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
	},
} satisfies Meta<typeof Modal>;

export const TriggerOpensModal: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<div data-testid="modal-test-container">
				<Button data-testid="open-button" onClick={() => setOpen(true)}>
					Open Modal
				</Button>
				<Modal open={open} onClose={() => setOpen(false)} title="Test Modal">
					<p data-testid="modal-content">Modal content</p>
				</Modal>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const openButton = canvas.getByTestId("open-button");

		await expect(openButton).toBeVisible();
		await userEvent.click(openButton);

		const bodyCanvas = within(document.body);
		const modalContent = await bodyCanvas.findByTestId("modal-content");
		await expect(modalContent).toBeVisible();
	},
};

export const CloseButtonClosesModal: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<div data-testid="close-test-container">
				<Button data-testid="trigger-button" onClick={() => setOpen(true)}>
					Open
				</Button>
				<Modal open={open} onClose={() => setOpen(false)} title="Test Modal">
					<p>Click the X button to close</p>
				</Modal>
				<div data-testid="modal-state">{open ? "open" : "closed"}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const triggerButton = canvas.getByTestId("trigger-button");
		const stateDisplay = canvas.getByTestId("modal-state");

		await expect(stateDisplay).toHaveTextContent("closed");

		await userEvent.click(triggerButton);
		await expect(stateDisplay).toHaveTextContent("open");

		const bodyCanvas = within(document.body);
		const closeButton = await bodyCanvas.findByRole("button", { name: /✕/i });
		await userEvent.click(closeButton);
		await expect(stateDisplay).toHaveTextContent("closed");
	},
};

export const DisplaysTitle: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<Modal open={open} onClose={() => setOpen(false)} title="Test Title">
				<p>Modal content</p>
			</Modal>
		);
	},
	play: async () => {
		const canvas = within(document.body);
		const title = await canvas.findByText("Test Title");

		await expect(title).toBeVisible();
	},
};

export const DisplaysChildren: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<Modal open={open} onClose={() => setOpen(false)} title="Modal">
				<div data-testid="child-content">This is the modal content</div>
			</Modal>
		);
	},
	play: async () => {
		const canvas = within(document.body);
		const content = await canvas.findByTestId("child-content");

		await expect(content).toBeVisible();
		await expect(content).toHaveTextContent("This is the modal content");
	},
};

export const DisplaysFooter: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title="Modal with Footer"
				footer={
					<Button data-testid="footer-button" variant="default">
						Action
					</Button>
				}
			>
				<p>Modal content</p>
			</Modal>
		);
	},
	play: async () => {
		const canvas = within(document.body);
		const footerButton = await canvas.findByTestId("footer-button");

		await expect(footerButton).toBeVisible();
		await expect(footerButton).toHaveTextContent("Action");
	},
};

export const HidesCloseButton: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title="No Close Button"
				showCloseButton={false}
			>
				<p>This modal has no close button</p>
			</Modal>
		);
	},
	play: async () => {
		const canvas = within(document.body);
		const closeButtons = canvas.queryAllByRole("button", { name: /✕/i });

		await expect(closeButtons.length).toBe(0);
	},
};

export const CallsOnCloseCallback: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);
		const [closeCount, setCloseCount] = useState(0);

		return (
			<div>
				<Button data-testid="open-btn" onClick={() => setOpen(true)}>
					Open Modal
				</Button>
				<div data-testid="close-count">{closeCount}</div>
				<Modal
					open={open}
					onClose={() => {
						setOpen(false);
						setCloseCount(closeCount + 1);
					}}
					title="Close Callback Test"
				>
					<p>Modal content</p>
				</Modal>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const openBtn = canvas.getByTestId("open-btn");
		const closeCount = canvas.getByTestId("close-count");

		await expect(closeCount).toHaveTextContent("0");

		await userEvent.click(openBtn);

		const bodyCanvas = within(document.body);
		const closeButton = await bodyCanvas.findByRole("button", { name: /✕/i });
		await userEvent.click(closeButton);

		await expect(closeCount).toHaveTextContent("1");
	},
};
