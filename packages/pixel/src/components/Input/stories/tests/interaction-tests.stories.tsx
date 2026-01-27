import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { Input } from "../../Input";

export default {
	title: "Components/Input/tests/Interaction Tests",
	component: Input,
	tags: ["interaction-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["value", "variant", "size", "disabled"],
		},
	},
} satisfies Meta<typeof Input>;

export const RendersWithPlaceholder: StoryObj<typeof Input> = {
	render: () => {
		const [value, setValue] = useState("");
		return (
			<Input
				data-testid="input"
				placeholder="Enter text..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByTestId("input");

		await expect(input).toBeTruthy();
		await expect(input).toBeVisible();
		await expect(input).toHaveAttribute("placeholder", "Enter text...");
	},
};

export const AcceptsTextInput: StoryObj<typeof Input> = {
	render: () => {
		const [value, setValue] = useState("");
		return (
			<div>
				<Input
					data-testid="text-input"
					placeholder="Type here..."
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
				<div data-testid="output" style={{ marginTop: "16px" }}>
					Value: {value}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByTestId("text-input");
		const output = canvas.getByTestId("output");

		await expect(output).toHaveTextContent("Value:");

		await userEvent.type(input, "Hello");
		await expect(output).toHaveTextContent("Value: Hello");

		await userEvent.clear(input);
		await userEvent.type(input, "World");
		await expect(output).toHaveTextContent("Value: World");
	},
};

export const DisabledInputCannotBeEdited: StoryObj<typeof Input> = {
	render: () => {
		const [value, setValue] = useState("Disabled");
		return (
			<div>
				<Input
					data-testid="disabled-input"
					disabled={true}
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByTestId("disabled-input");

		await expect(input).toBeDisabled();
		await expect(input).toHaveValue("Disabled");
	},
};

export const AppliesVariantStyles: StoryObj<typeof Input> = {
	render: () => {
		const [value1, setValue1] = useState("");
		const [value2, setValue2] = useState("");
		const [value3, setValue3] = useState("");
		const [value4, setValue4] = useState("");

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<Input
					data-testid="input-default"
					variant="default"
					placeholder="Default"
					value={value1}
					onChange={(e) => setValue1(e.target.value)}
				/>
				<Input
					data-testid="input-success"
					variant="success"
					placeholder="Success"
					value={value2}
					onChange={(e) => setValue2(e.target.value)}
				/>
				<Input
					data-testid="input-error"
					variant="error"
					placeholder="Error"
					value={value3}
					onChange={(e) => setValue3(e.target.value)}
				/>
				<Input
					data-testid="input-warning"
					variant="warning"
					placeholder="Warning"
					value={value4}
					onChange={(e) => setValue4(e.target.value)}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const defaultInput = canvas.getByTestId("input-default");
		const successInput = canvas.getByTestId("input-success");
		const errorInput = canvas.getByTestId("input-error");
		const warningInput = canvas.getByTestId("input-warning");

		await expect(defaultInput).toBeVisible();
		await expect(successInput).toBeVisible();
		await expect(errorInput).toBeVisible();
		await expect(warningInput).toBeVisible();

		const defaultStyle = window.getComputedStyle(defaultInput);
		await expect(defaultStyle.borderWidth).toBeTruthy();
	},
};

export const AppliesSizeStyles: StoryObj<typeof Input> = {
	render: () => {
		const [value1, setValue1] = useState("");
		const [value2, setValue2] = useState("");
		const [value3, setValue3] = useState("");

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
				<Input
					data-testid="input-small"
					size="sm"
					placeholder="Small"
					value={value1}
					onChange={(e) => setValue1(e.target.value)}
				/>
				<Input
					data-testid="input-medium"
					size="md"
					placeholder="Medium"
					value={value2}
					onChange={(e) => setValue2(e.target.value)}
				/>
				<Input
					data-testid="input-large"
					size="lg"
					placeholder="Large"
					value={value3}
					onChange={(e) => setValue3(e.target.value)}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const smallInput = canvas.getByTestId("input-small");
		const mediumInput = canvas.getByTestId("input-medium");
		const largeInput = canvas.getByTestId("input-large");

		await expect(smallInput).toBeVisible();
		await expect(mediumInput).toBeVisible();
		await expect(largeInput).toBeVisible();

		const smallStyle = window.getComputedStyle(smallInput);
		const mediumStyle = window.getComputedStyle(mediumInput);
		const largeStyle = window.getComputedStyle(largeInput);

		await expect(smallStyle.paddingLeft).toBeTruthy();
		await expect(mediumStyle.paddingLeft).toBeTruthy();
		await expect(largeStyle.paddingLeft).toBeTruthy();
	},
};
