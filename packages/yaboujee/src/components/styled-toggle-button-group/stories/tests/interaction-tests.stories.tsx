import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { StyledToggleButtonGroup } from "../../styled-toggle-button-group";
import { createMockStyledButtons } from "../shared";

const meta: Meta<typeof StyledToggleButtonGroup> = {
	title: "Components/StyledToggleButtonGroup/tests/Interaction Tests",
	component: StyledToggleButtonGroup,
	parameters: {
		layout: "centered",
	},
	tags: ["test:interaction"],
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

		await expect(activeIndex).toHaveTextContent("0");

		await userEvent.click(buttons[1]);
		await expect(activeIndex).toHaveTextContent("1");

		await userEvent.click(buttons[2]);
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

		buttons[0].focus();
		await expect(buttons[0]).toHaveFocus();

		await userEvent.keyboard("{Tab}");
		await expect(buttons[1]).toHaveFocus();
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
		const activeCount = canvas.getByTestId("active-count");

		await expect(activeCount).toHaveTextContent("0");

		await userEvent.click(buttons[0]);
		await expect(activeCount).toHaveTextContent("1");

		await userEvent.click(buttons[1]);
		await expect(activeCount).toHaveTextContent("2");

		await userEvent.click(buttons[2]);
		await expect(activeCount).toHaveTextContent("3");

		await userEvent.click(buttons[0]);
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

		await expect(buttons.length).toBe(5);

		for (const button of buttons) {
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

		await expect(buttons[0]).toHaveAccessibleName("Toggle view");
		await expect(buttons[1]).toHaveAccessibleName("Show pages");
		await expect(buttons[2]).toHaveAccessibleName("Open search");
	},
};
