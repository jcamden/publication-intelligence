import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { useState } from "react";
import { Window } from "../../window";
import {
	clickMaximizeButton,
	clickWindowTitleHeading,
	focusStateShows,
	maximizedStateShows,
	scrollTestHeadingIsVisible,
	unpopAndCloseButtonsAreVisible,
} from "../helpers/steps";

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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await focusStateShows({ canvas, expected: "not-focused", step });
		await clickWindowTitleHeading({
			canvas,
			user,
			name: /focus test window/i,
			step,
		});
		await focusStateShows({ canvas, expected: "focused", step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const user = userEvent.setup();
		await maximizedStateShows({ canvas, expected: "normal", step });
		await clickMaximizeButton({ canvas, user, step });
		await maximizedStateShows({ canvas, expected: "maximized", step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await unpopAndCloseButtonsAreVisible({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await scrollTestHeadingIsVisible({ canvas, step });
	},
};
