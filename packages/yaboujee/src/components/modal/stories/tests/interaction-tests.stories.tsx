import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { Modal } from "../../modal";
import {
	closeCallbackIsCalledOnce,
	modalChildContentIsVisible,
	modalContentIsVisible,
	modalFooterIsVisible,
	modalTitleIsVisible,
	noCloseButtonIsVisible,
	openModalByClickingOpenButton,
	triggerModalOpenAndClose,
} from "../helpers/steps";

export default {
	...defaultInteractionTestMeta,
	title: "Components/Modal/tests/Interaction Tests",
	component: Modal,
	parameters: {
		...defaultInteractionTestMeta.parameters,
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await openModalByClickingOpenButton({
			canvas,
			user,
			step,
		});
		await modalContentIsVisible({ step });
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await triggerModalOpenAndClose({
			canvas,
			user,
			step,
		});
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
	play: async ({ step }) => {
		await modalTitleIsVisible({
			title: "Test Title",
			step,
		});
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
	play: async ({ step }) => {
		await modalChildContentIsVisible({ step });
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
	play: async ({ step }) => {
		await modalFooterIsVisible({ step });
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
	play: async ({ step }) => {
		await noCloseButtonIsVisible({ step });
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await closeCallbackIsCalledOnce({
			canvas,
			user,
			step,
		});
	},
};
