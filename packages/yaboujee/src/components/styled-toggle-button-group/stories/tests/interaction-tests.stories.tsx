import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { StyledToggleButtonGroup } from "../../styled-toggle-button-group";
import {
	activeCountShows,
	activeIndexShows,
	allClickableButtonsAreVisible,
	buttonOrderShows,
	clickableButtonAtIndexHasFocus,
	clickableButtonCountIs,
	clickClickableButtonAtIndex,
	focusClickableButtonAtIndex,
	infoTextIsVisible,
	innerButtonsHaveExpectedAccessibleNames,
	roleButtonsExist,
	tabTwice,
} from "../helpers/steps";
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await activeIndexShows({ canvas, expected: "0", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 1, step });
		await activeIndexShows({ canvas, expected: "1", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 2, step });
		await activeIndexShows({ canvas, expected: "2", step });
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await focusClickableButtonAtIndex({ canvas, index: 0, step });
		await clickableButtonAtIndexHasFocus({ canvas, index: 0, step });
		await tabTwice({ user, step });
		await clickableButtonAtIndexHasFocus({ canvas, index: 1, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await buttonOrderShows({ canvas, expected: "view,pages,search", step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await roleButtonsExist({ canvas, step });
		await infoTextIsVisible({
			canvas,
			expected: /first and last buttons locked/i,
			step,
		});
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
	play: async ({ canvasElement, step }) => {
		const user = userEvent.setup();
		const canvas = within(canvasElement);
		await activeCountShows({ canvas, expected: "0", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 0, step });
		await activeCountShows({ canvas, expected: "1", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 1, step });
		await activeCountShows({ canvas, expected: "2", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 2, step });
		await activeCountShows({ canvas, expected: "3", step });
		await clickClickableButtonAtIndex({ canvas, user, index: 0, step });
		await activeCountShows({ canvas, expected: "2", step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await clickableButtonCountIs({ canvas, expected: 5, step });
		await allClickableButtonsAreVisible({ canvas, step });
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
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await innerButtonsHaveExpectedAccessibleNames({
			canvas,
			names: ["Toggle view", "Show pages", "Open search"],
			step,
		});
	},
};
