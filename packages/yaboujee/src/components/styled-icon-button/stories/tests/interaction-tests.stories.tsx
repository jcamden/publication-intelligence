import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "@storybook/test";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { StyledIconButton } from "../../styled-icon-button";
import {
	activeStateShowsActive,
	activeStateShowsInactive,
	clickFirstIconButtonInWrapper,
	clickFirstIconButtonOnCanvas,
	disabledOuterButtonHasTabIndexMinusOne,
	firstButtonInContainer1HasFocus,
	firstButtonInContainer2HasFocus,
	firstIconButtonHasRoleButton,
	firstIconButtonInWrapperIsVisible,
	focusFirstButtonInContainer1,
	focusFirstIconButtonInWrapper,
	innerIconButtonIsDisabled,
	innerTooltipButtonHasAccessibleNameAndTitle,
	onClickCallbackIsCalledOnce,
	onClickCallbackIsCalledOnceAfterKeyboard,
	onClickCallbackIsNotCalled,
	pressEnterKey,
	pressSpaceKey,
	tabTwiceToSecondGroupOuterButton,
} from "../helpers/steps";
import {
	defaultStyledIconButtonArgs,
	STYLED_ICON_BUTTON_TEST_IDS,
} from "../shared";

const meta: Meta<typeof StyledIconButton> = {
	...defaultInteractionTestMeta,
	title: "Components/StyledIconButton/tests/Interaction Tests",
	component: StyledIconButton,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test click handler fires
 */
export const ClickHandler: Story = {
	args: {
		onClick: fn(),
	},
	render: (args) => {
		const { onClick, ...rest } = args;
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					{...rest}
					icon={Eye}
					onClick={onClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step, args }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		const onClick = args.onClick as ReturnType<typeof fn>;
		onClick.mockClear();
		await clickFirstIconButtonInWrapper({ canvas, user, step });
		await firstIconButtonInWrapperIsVisible({ canvas, step });
		await onClickCallbackIsCalledOnce({ onClick, step });
	},
};

/**
 * Test keyboard navigation with Enter key
 */
export const KeyboardEnter: Story = {
	args: {
		onClick: fn(),
	},
	render: (args) => {
		const { onClick, ...rest } = args;
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					{...rest}
					icon={Eye}
					onClick={onClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step, args }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		const onClick = args.onClick as ReturnType<typeof fn>;
		onClick.mockClear();
		await focusFirstIconButtonInWrapper({ canvas, step });
		await pressEnterKey({ user, step });
		await firstIconButtonHasRoleButton({ canvas, step });
		await onClickCallbackIsCalledOnceAfterKeyboard({ onClick, step });
	},
};

/**
 * Test keyboard navigation with Space key
 */
export const KeyboardSpace: Story = {
	args: {
		onClick: fn(),
	},
	render: (args) => {
		const { onClick, ...rest } = args;
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					{...rest}
					icon={Eye}
					onClick={onClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step, args }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		const onClick = args.onClick as ReturnType<typeof fn>;
		onClick.mockClear();
		await focusFirstIconButtonInWrapper({ canvas, step });
		await pressSpaceKey({ user, step });
		await firstIconButtonHasRoleButton({ canvas, step });
		await onClickCallbackIsCalledOnceAfterKeyboard({ onClick, step });
	},
};

/**
 * Test disabled button prevents clicks
 */
export const DisabledClickPrevention: Story = {
	args: {
		onClick: fn(),
		disabled: true,
	},
	render: (args) => {
		const { onClick, ...rest } = args;
		return (
			<div data-testid={STYLED_ICON_BUTTON_TEST_IDS.wrapper}>
				<StyledIconButton
					{...defaultStyledIconButtonArgs}
					{...rest}
					icon={Eye}
					onClick={onClick}
				/>
			</div>
		);
	},
	play: async ({ canvasElement, step, args }) => {
		const canvas = within(canvasElement);
		const onClick = args.onClick as ReturnType<typeof fn>;
		onClick.mockClear();
		await onClickCallbackIsNotCalled({ onClick, step });
		await disabledOuterButtonHasTabIndexMinusOne({ canvas, step });
		await innerIconButtonIsDisabled({ canvas, step });
		await onClickCallbackIsNotCalled({ onClick, step });
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await activeStateShowsInactive({ canvas, step });
		await clickFirstIconButtonOnCanvas({ canvas, user, step });
		await activeStateShowsActive({ canvas, step });
		await clickFirstIconButtonOnCanvas({ canvas, user, step });
		await activeStateShowsInactive({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await focusFirstButtonInContainer1({ canvas, step });
		await firstButtonInContainer1HasFocus({ canvas, step });
		await tabTwiceToSecondGroupOuterButton({ user, step });
		await firstButtonInContainer2HasFocus({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await innerTooltipButtonHasAccessibleNameAndTitle({
			canvas,
			expected: "Toggle visibility",
			step,
		});
	},
};
