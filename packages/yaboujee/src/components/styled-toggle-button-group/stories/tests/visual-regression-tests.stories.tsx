import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { StyledToggleButtonGroup } from "../../styled-toggle-button-group";
import { createMockStyledButtons } from "../shared";

const meta: Meta<typeof StyledToggleButtonGroup> = {
	title: "Components/StyledToggleButtonGroup/tests/Visual Regression Tests",
	component: StyledToggleButtonGroup,
	parameters: {
		...visualRegressionTestConfig,
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderAllVariants = () => (
	<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				All Inactive
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 3, activeIndices: [] })}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Single Active (First)
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 3, activeIndices: [0] })}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Single Active (Middle)
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 3, activeIndices: [1] })}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Multiple Active
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 3, activeIndices: [0, 2] })}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				All Active
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({
					count: 3,
					activeIndices: [0, 1, 2],
				})}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Two Buttons
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 2, activeIndices: [0] })}
			/>
		</div>

		<div>
			<div
				style={{
					fontSize: "12px",
					fontWeight: "bold",
					marginBottom: "8px",
				}}
			>
				Many Buttons (5)
			</div>
			<StyledToggleButtonGroup
				buttons={createMockStyledButtons({ count: 5, activeIndices: [1, 3] })}
			/>
		</div>
	</div>
);

/**
 * All button states
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2" },
	},
	render: renderAllVariants,
};

/**
 * All button states in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2" },
		theme: "dark",
	},
	render: renderAllVariants,
};
