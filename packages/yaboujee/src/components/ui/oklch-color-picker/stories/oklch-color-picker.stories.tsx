import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { OklchColorPicker } from "../oklch-color-picker";

const meta = {
	title: "Yaboujee/OklchColorPicker",
	component: OklchColorPicker,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof OklchColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveColorPicker = () => {
	const [color, setColor] = useState({ hue: 230 });

	return (
		<div className="flex flex-col gap-4">
			<OklchColorPicker
				value={color}
				onChange={setColor}
				label="Choose color"
			/>
			<div className="text-sm space-y-2">
				<div>Hue: {Math.round(color.hue)}°</div>
				<div className="text-xs text-gray-600">
					Lightness and saturation are applied programmatically based on context
				</div>
			</div>
		</div>
	);
};

export const Default: Story = {
	args: {
		value: { hue: 230 },
		onChange: () => {},
	},
	render: () => <InteractiveColorPicker />,
};

export const Orange: Story = {
	args: {
		value: { hue: 30 },
		onChange: () => {},
		label: "Orange",
	},
};

export const Blue: Story = {
	args: {
		value: { hue: 230 },
		onChange: () => {},
		label: "Blue",
	},
};

export const Green: Story = {
	args: {
		value: { hue: 120 },
		onChange: () => {},
		label: "Green",
	},
};

export const Pink: Story = {
	args: {
		value: { hue: 340 },
		onChange: () => {},
		label: "Pink",
	},
};
