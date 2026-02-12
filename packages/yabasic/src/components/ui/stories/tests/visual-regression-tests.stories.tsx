import { defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker, DEFAULT_COLORS } from "../../color-picker";

const meta = {
	...defaultVrtMeta,
	title: "Yabasic/ColorPicker/tests/Visual Regression Tests",
	component: ColorPicker,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultGlobals = {
	backgrounds: { value: "light" },
	pseudo: {},
};

export const Closed: Story = {
	args: {
		value: "#fef3c7",
		onChange: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const ClosedDarkMode: Story = {
	args: {
		value: "#bfdbfe",
		onChange: () => {},
	},
	globals: {
		...defaultGlobals,
		backgrounds: { value: "dark" },
		viewport: { value: "mobile1" },
	},
};

export const Open: Story = {
	args: {
		value: "#fef3c7",
		onChange: () => {},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const button = canvasElement.querySelector("button");
		if (button) {
			button.click();
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	},
};

export const OpenDarkMode: Story = {
	args: {
		value: "#bfdbfe",
		onChange: () => {},
	},
	globals: {
		...defaultGlobals,
		backgrounds: { value: "dark" },
		viewport: { value: "mobile1" },
	},
	play: async ({ canvasElement }) => {
		const button = canvasElement.querySelector("button");
		if (button) {
			button.click();
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	},
};

export const WithCustomLabel: Story = {
	args: {
		value: "#e9d5ff",
		onChange: () => {},
		label: "Pick highlight color",
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const AllColors: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-2 p-4">
			{DEFAULT_COLORS.slice(0, 8).map((color) => (
				<ColorPicker
					key={color.value}
					value={color.value}
					onChange={() => {}}
				/>
			))}
		</div>
	),
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
};

export const HoverState: Story = {
	args: {
		value: "#fef3c7",
		onChange: () => {},
	},
	parameters: {
		pseudo: {
			hover: ["button"],
		},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};

export const FocusState: Story = {
	args: {
		value: "#fef3c7",
		onChange: () => {},
	},
	parameters: {
		pseudo: {
			focus: ["button"],
		},
	},
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	play: async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	},
};
