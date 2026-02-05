import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { Window } from "../../window";

const meta: Meta<typeof Window> = {
	...defaultInteractionTestMeta,
	title: "Components/Window/tests/Interaction Tests",
	component: Window,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test window focus behavior
 */
export const FocusBehavior: Story = {
	render: () => {
		const [focused, setFocused] = useState(false);

		return (
			<div>
				<Window
					id="focus-test"
					title="Focus Test Window"
					zIndex={1000}
					isMaximized={false}
					sidebarCollapsed={false}
					position={{ x: 6.25, y: 6.25 }}
					size={{ width: 25, height: 18.75 }}
					side="left"
					onUnpop={() => {}}
					onClose={() => {}}
					onMaximize={() => {}}
					onPositionChange={() => {}}
					onSizeChange={() => {}}
					onFocus={() => setFocused(true)}
				>
					<div style={{ padding: "16px" }}>Window content</div>
				</Window>
				<div data-testid="focus-state">
					{focused ? "focused" : "not-focused"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const focusState = canvas.getByTestId("focus-state");

		await expect(focusState).toHaveTextContent("not-focused");

		const window = canvas.getByRole("heading", { name: /focus test window/i });
		await userEvent.click(window);

		await expect(focusState).toHaveTextContent("focused");
	},
};

/**
 * Test maximize button
 */
export const MaximizeButton: Story = {
	render: () => {
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<div>
				<Window
					id="maximize-test"
					title="Maximize Test"
					zIndex={1000}
					isMaximized={isMaximized}
					sidebarCollapsed={false}
					position={{ x: 6.25, y: 6.25 }}
					size={{ width: 25, height: 18.75 }}
					side="left"
					onUnpop={() => {}}
					onClose={() => {}}
					onMaximize={() => setIsMaximized(!isMaximized)}
					onPositionChange={() => {}}
					onSizeChange={() => {}}
					onFocus={() => {}}
				>
					<div style={{ padding: "16px" }}>Content</div>
				</Window>
				<div data-testid="maximized-state">
					{isMaximized ? "maximized" : "normal"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const maximizedState = canvas.getByTestId("maximized-state");

		await expect(maximizedState).toHaveTextContent("normal");

		const maximizeButton = canvas.getByLabelText("Maximize");
		await userEvent.click(maximizeButton);

		await expect(maximizedState).toHaveTextContent("maximized");
	},
};

/**
 * Test close and unpop buttons
 */
export const CloseAndUnpopButtons: Story = {
	render: () => {
		return (
			<div style={{ display: "flex", gap: "20px" }}>
				<div data-testid="with-unpop">
					<Window
						id="unpop-test"
						title="With Unpop"
						zIndex={1000}
						isMaximized={false}
						sidebarCollapsed={false}
						position={{ x: 6.25, y: 6.25 }}
						size={{ width: 20, height: 15 }}
						side="left"
						onUnpop={() => {}}
						onClose={() => {}}
						onMaximize={() => {}}
						onPositionChange={() => {}}
						onSizeChange={() => {}}
						onFocus={() => {}}
					>
						<div style={{ padding: "16px" }}>Content</div>
					</Window>
				</div>

				<div data-testid="with-close">
					<Window
						id="close-test"
						title="With Close"
						zIndex={1000}
						isMaximized={false}
						sidebarCollapsed={true}
						position={{ x: 30, y: 6.25 }}
						size={{ width: 20, height: 15 }}
						side="left"
						onUnpop={() => {}}
						onClose={() => {}}
						onMaximize={() => {}}
						onPositionChange={() => {}}
						onSizeChange={() => {}}
						onFocus={() => {}}
					>
						<div style={{ padding: "16px" }}>Content</div>
					</Window>
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const withUnpop = canvas.getByTestId("with-unpop");
		const unpopButton = within(withUnpop).getByLabelText("Return to sidebar");
		await expect(unpopButton).toBeVisible();

		const withClose = canvas.getByTestId("with-close");
		const closeButton = within(withClose).getByLabelText("Close");
		await expect(closeButton).toBeVisible();
	},
};

/**
 * Test scrollable content detection
 */
export const ScrollableContentDetection: Story = {
	render: () => {
		return (
			<Window
				id="scroll-test"
				title="Scroll Test"
				zIndex={1000}
				isMaximized={false}
				sidebarCollapsed={false}
				position={{ x: 6.25, y: 6.25 }}
				size={{ width: 25, height: 18.75 }}
				side="left"
				onUnpop={() => {}}
				onClose={() => {}}
				onMaximize={() => {}}
				onPositionChange={() => {}}
				onSizeChange={() => {}}
				onFocus={() => {}}
			>
				<div style={{ padding: "16px" }}>
					{Array.from({ length: 30 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static test content
						<p key={i}>Line {i + 1}</p>
					))}
				</div>
			</Window>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const window = canvas.getByRole("heading", { name: /scroll test/i });

		await expect(window).toBeVisible();
	},
};
