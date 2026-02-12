import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ColorPicker, DEFAULT_COLORS } from "../color-picker";

const meta = {
	title: "Yabasic/ColorPicker",
	component: ColorPicker,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveColorPicker = () => {
	const [color, setColor] = useState("#fef3c7");

	return (
		<div className="flex flex-col gap-4">
			<ColorPicker value={color} onChange={setColor} />
			<div className="text-sm">
				<div>Selected color: {color}</div>
				<div
					className="mt-2 h-20 w-40 rounded border border-gray-300"
					style={{ backgroundColor: color }}
				/>
			</div>
		</div>
	);
};

export const Default: Story = {
	render: () => <InteractiveColorPicker />,
};

export const CustomColors: Story = {
	render: () => {
		const [color, setColor] = useState("#ff0000");
		const customColors = [
			{ value: "#ff0000", label: "Red" },
			{ value: "#00ff00", label: "Green" },
			{ value: "#0000ff", label: "Blue" },
			{ value: "#ffff00", label: "Yellow" },
			{ value: "#ff00ff", label: "Magenta" },
			{ value: "#00ffff", label: "Cyan" },
		];

		return (
			<div className="flex flex-col gap-4">
				<ColorPicker value={color} onChange={setColor} colors={customColors} />
				<div className="text-sm">
					<div>Selected color: {color}</div>
					<div
						className="mt-2 h-20 w-40 rounded border border-gray-300"
						style={{ backgroundColor: color }}
					/>
				</div>
			</div>
		);
	},
};

export const WithCustomLabel: Story = {
	args: {
		value: "#bfdbfe",
		onChange: () => {},
		label: "Choose your highlight color",
	},
};

export const ShowingAllDefaultColors: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4">
			{DEFAULT_COLORS.map((color) => (
				<div key={color.value} className="flex flex-col gap-2">
					<ColorPicker value={color.value} onChange={() => {}} />
					<div className="text-xs text-gray-600">
						{color.label} - {color.value}
					</div>
				</div>
			))}
		</div>
	),
};
