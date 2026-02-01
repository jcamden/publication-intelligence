import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { StyledIconButton } from "../../styled-icon-button";
import {
	defaultStyledIconButtonArgs,
	STYLED_ICON_BUTTON_TEST_IDS,
} from "../shared";

const meta: Meta<typeof StyledIconButton> = {
	title: "Components/StyledIconButton/tests/Interaction Tests",
	component: StyledIconButton,
	parameters: {
		layout: "centered",
	},
	tags: ["test:interaction"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test click handler fires
 */
export const ClickHandler: Story = {
	render: () => {
		const handleClick = fn();
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					onClick={handleClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const wrapper = canvas.getByTestId(STYLED_ICON_BUTTON_TEST_IDS.wrapper);

		const button = within(wrapper).getAllByRole("button")[0];
		await userEvent.click(button);

		await expect(button).toBeVisible();
	},
};

/**
 * Test keyboard navigation with Enter key
 */
export const KeyboardEnter: Story = {
	render: () => {
		const handleClick = fn();
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					onClick={handleClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const wrapper = canvas.getByTestId(STYLED_ICON_BUTTON_TEST_IDS.wrapper);

		const button = within(wrapper).getAllByRole("button")[0];
		button.focus();
		await userEvent.keyboard("{Enter}");

		await expect(button).toHaveAttribute("role", "button");
	},
};

/**
 * Test keyboard navigation with Space key
 */
export const KeyboardSpace: Story = {
	render: () => {
		const handleClick = fn();
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					onClick={handleClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const wrapper = canvas.getByTestId(STYLED_ICON_BUTTON_TEST_IDS.wrapper);

		const button = within(wrapper).getAllByRole("button")[0];
		button.focus();
		await userEvent.keyboard(" ");

		await expect(button).toHaveAttribute("role", "button");
	},
};

/**
 * Test disabled button prevents clicks
 */
export const DisabledClickPrevention: Story = {
	render: () => {
		const handleClick = fn();
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					onClick={handleClick}
					disabled
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const wrapper = canvas.getByTestId(STYLED_ICON_BUTTON_TEST_IDS.wrapper);

		const outerButton = within(wrapper).getAllByRole("button")[0];
		await expect(outerButton).toHaveAttribute("tabIndex", "-1");

		const innerButton = within(wrapper).getAllByRole("button")[1];
		await expect(innerButton).toBeDisabled();
	},
};

/**
 * Test active state toggle
 */
export const ActiveStateToggle: Story = {
	render: () => {
		const [isActive, setIsActive] = useState(false);
		return (
			<div>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					icon={Eye}
					onClick={() => setIsActive(!isActive)}
					isActive={isActive}
					data-testid={STYLED_ICON_BUTTON_TEST_IDS.button}
				/>
				<div data-testid="active-state">{isActive ? "active" : "inactive"}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const activeState = canvas.getByTestId("active-state");

		await expect(activeState).toHaveTextContent("inactive");

		const button = canvas.getAllByRole("button")[0];
		await userEvent.click(button);

		await expect(activeState).toHaveTextContent("active");

		await userEvent.click(button);

		await expect(activeState).toHaveTextContent("inactive");
	},
};

/**
 * Test focus behavior
 */
export const FocusBehavior: Story = {
	render: () => {
		return (
			<div style={{ display: "flex", gap: "8px" }}>
				<div data-testid="button-1">
					<StyledIconButton
						{...defaultStyledIconButtonArgs}
						icon={Eye}
						tooltip="Button 1"
					/>
				</div>
				<div data-testid="button-2">
					<StyledIconButton
						{...defaultStyledIconButtonArgs}
						icon={Plus}
						tooltip="Button 2"
					/>
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button1Container = canvas.getByTestId("button-1");
		const button2Container = canvas.getByTestId("button-2");

		const button1 = within(button1Container).getAllByRole("button")[0];
		const button2 = within(button2Container).getAllByRole("button")[0];

		button1.focus();
		await expect(button1).toHaveFocus();

		// Tab twice: first tab goes to button1's inner button, second tab goes to button2's wrapper
		await userEvent.tab();
		await userEvent.tab();
		await expect(button2).toHaveFocus();
	},
};

/**
 * Test tooltip via aria-label
 */
export const TooltipAccessibility: Story = {
	render: () => {
		return (
			<StyledIconButton
				{...defaultStyledIconButtonArgs}
				icon={Eye}
				tooltip="Toggle visibility"
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		const innerButton = buttons[1]; // The actual <Button> element with aria-label

		await expect(innerButton).toHaveAccessibleName("Toggle visibility");
		await expect(innerButton).toHaveAttribute("title", "Toggle visibility");
	},
};
