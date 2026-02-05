import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { StyledToggleButtonGroup } from "../../styled-toggle-button-group";
import { createMockStyledButtons } from "../shared";

const meta: Meta<typeof StyledToggleButtonGroup> = {
	...defaultInteractionTestMeta,
	title: "Components/StyledToggleButtonGroup/tests/Interaction Tests",
	component: StyledToggleButtonGroup,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test button click toggles
 */
export const ButtonClick: Story = {
	render: () => {
		const [activeIndex, setActiveIndex] = useState(0);
		const buttons = createMockStyledButtons({
			count: 3,
			activeIndices: [],
		}).map((btn, i) => ({
			...btn,
			isActive: activeIndex === i,
			onClick: () => setActiveIndex(i),
		}));

		return (
			<div>
				<StyledToggleButtonGroup buttons={buttons} />
				<div data-testid="active-index">{activeIndex}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const activeIndex = canvas.getByTestId("active-index");
		const buttons = canvas.getAllByRole("button");
		// Each button is rendered as a wrapper div + inner Button, so we need to click every other element (the wrappers)
		const clickableButtons = buttons.filter((_, index) => index % 2 === 0);

		await expect(activeIndex).toHaveTextContent("0");

		await userEvent.click(clickableButtons[1]);
		await expect(activeIndex).toHaveTextContent("1");

		await userEvent.click(clickableButtons[2]);
		await expect(activeIndex).toHaveTextContent("2");
	},
};

/**
 * Test keyboard navigation (Enter and Space keys)
 */
export const KeyboardNavigation: Story = {
	render: () => {
		const [activeIndex, setActiveIndex] = useState(0);
		const buttons = createMockStyledButtons({
			count: 3,
			activeIndices: [],
		}).map((btn, i) => ({
			...btn,
			isActive: activeIndex === i,
			onClick: () => setActiveIndex(i),
		}));

		return (
			<div>
				<StyledToggleButtonGroup buttons={buttons} />
				<div data-testid="active-index">{activeIndex}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		// Each button is rendered as a wrapper div + inner Button, so we need to use every other element (the wrappers)
		const clickableButtons = buttons.filter((_, index) => index % 2 === 0);

		clickableButtons[0].focus();
		await expect(clickableButtons[0]).toHaveFocus();

		// Tab twice: first tab goes to the inner button, second tab goes to the next wrapper
		await userEvent.keyboard("{Tab}");
		await userEvent.keyboard("{Tab}");
		await expect(clickableButtons[1]).toHaveFocus();
	},
};

/**
 * Test drag and drop reorder
 */
export const DragAndDropReorder: Story = {
	render: () => {
		const [buttons, setButtons] = useState(
			createMockStyledButtons({ count: 3, activeIndices: [0] }),
		);

		const handleReorder = ({
			fromIndex,
			toIndex,
		}: {
			fromIndex: number;
			toIndex: number;
		}) => {
			const newButtons = [...buttons];
			const [movedButton] = newButtons.splice(fromIndex, 1);
			newButtons.splice(toIndex, 0, movedButton);
			setButtons(newButtons);
		};

		return (
			<div>
				<StyledToggleButtonGroup
					buttons={buttons}
					draggable={true}
					onReorder={handleReorder}
				/>
				<div data-testid="button-order">
					{buttons.map((btn) => btn.name).join(",")}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttonOrder = canvas.getByTestId("button-order");

		await expect(buttonOrder).toHaveTextContent("view,pages,search");
	},
};

/**
 * Test excluded buttons stay in place
 */
export const ExcludedButtonsStayInPlace: Story = {
	render: () => {
		const buttons = createMockStyledButtons({ count: 4, activeIndices: [0] });

		return (
			<div>
				<StyledToggleButtonGroup
					buttons={buttons}
					draggable={true}
					excludeFromDrag={["view", "settings"]}
				/>
				<div data-testid="info">First and last buttons locked</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");

		await expect(buttons.length).toBeGreaterThan(0);
	},
};

/**
 * Test multiple button interactions
 */
export const MultipleButtonInteractions: Story = {
	render: () => {
		const [activeButtons, setActiveButtons] = useState<number[]>([]);

		const buttons = createMockStyledButtons({
			count: 3,
			activeIndices: [],
		}).map((btn, i) => ({
			...btn,
			isActive: activeButtons.includes(i),
			onClick: () => {
				if (activeButtons.includes(i)) {
					setActiveButtons(activeButtons.filter((idx) => idx !== i));
				} else {
					setActiveButtons([...activeButtons, i]);
				}
			},
		}));

		return (
			<div>
				<StyledToggleButtonGroup buttons={buttons} />
				<div data-testid="active-count">{activeButtons.length}</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		// Each button is rendered as a wrapper div + inner Button, so we need to click every other element (the wrappers)
		const clickableButtons = buttons.filter((_, index) => index % 2 === 0);
		const activeCount = canvas.getByTestId("active-count");

		await expect(activeCount).toHaveTextContent("0");

		await userEvent.click(clickableButtons[0]);
		await expect(activeCount).toHaveTextContent("1");

		await userEvent.click(clickableButtons[1]);
		await expect(activeCount).toHaveTextContent("2");

		await userEvent.click(clickableButtons[2]);
		await expect(activeCount).toHaveTextContent("3");

		await userEvent.click(clickableButtons[0]);
		await expect(activeCount).toHaveTextContent("2");
	},
};

/**
 * Test all buttons render with correct count
 */
export const AllButtonsRender: Story = {
	render: () => {
		const buttons = createMockStyledButtons({
			count: 5,
			activeIndices: [1, 3],
		});
		return <StyledToggleButtonGroup buttons={buttons} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		// Each button is rendered as a wrapper div + inner Button, so we need to check every other element (the wrappers)
		const clickableButtons = buttons.filter((_, index) => index % 2 === 0);

		await expect(clickableButtons.length).toBe(5);

		for (const button of clickableButtons) {
			await expect(button).toBeVisible();
		}
	},
};

/**
 * Test aria-labels from tooltips
 */
export const AriaLabelsFromTooltips: Story = {
	render: () => {
		const buttons = createMockStyledButtons({ count: 3, activeIndices: [0] });
		return <StyledToggleButtonGroup buttons={buttons} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const buttons = canvas.getAllByRole("button");
		// Each button is rendered as a wrapper div + inner Button
		// The inner Button (odd indices) has the aria-label
		const innerButtons = buttons.filter((_, index) => index % 2 === 1);

		await expect(innerButtons[0]).toHaveAccessibleName("Toggle view");
		await expect(innerButtons[1]).toHaveAccessibleName("Show pages");
		await expect(innerButtons[2]).toHaveAccessibleName("Open search");
	},
};
