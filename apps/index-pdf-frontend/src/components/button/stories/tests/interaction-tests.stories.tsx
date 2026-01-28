import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button } from "../../index";

export default {
	title: "Components/Button/tests/Interaction Tests",
	component: Button,
	tags: ["interaction-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["children", "variant", "size", "disabled"],
		},
	},
} satisfies Meta<typeof Button>;

export const RendersWithText: StoryObj<typeof Button> = {
	args: { children: "Click me" },
	render: (args) => <Button {...args} data-testid="button" />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByTestId("button");

		await expect(button).toBeTruthy();
		await expect(button).toBeVisible();
		await expect(button).toHaveTextContent("Click me");
	},
};

export const HandlesClickEvents: StoryObj<typeof Button> = {
	render: () => {
		const handleClick = () => {
			const output = document.getElementById("click-output");
			if (output) {
				const currentCount = Number.parseInt(output.textContent || "0", 10);
				output.textContent = String(currentCount + 1);
			}
		};

		return (
			<div>
				<Button data-testid="clickable-button" onClick={handleClick}>
					Click me
				</Button>
				<div
					id="click-output"
					data-testid="click-count"
					style={{ marginTop: "16px" }}
				>
					0
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByTestId("clickable-button");
		const output = canvas.getByTestId("click-count");

		await expect(output).toHaveTextContent("0");

		await userEvent.click(button);
		await expect(output).toHaveTextContent("1");

		await userEvent.click(button);
		await expect(output).toHaveTextContent("2");
	},
};

export const DisabledButtonDoesNotClick: StoryObj<typeof Button> = {
	render: () => {
		const handleClick = () => {
			const output = document.getElementById("disabled-output");
			if (output) {
				output.textContent = "Clicked!";
			}
		};

		return (
			<div>
				<Button
					data-testid="disabled-button"
					disabled={true}
					onClick={handleClick}
				>
					Disabled Button
				</Button>
				<div
					id="disabled-output"
					data-testid="disabled-output"
					style={{ marginTop: "16px" }}
				>
					Not clicked
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByTestId("disabled-button");
		const output = canvas.getByTestId("disabled-output");

		await expect(button).toBeDisabled();
		await expect(output).toHaveTextContent("Not clicked");

		await userEvent.click(button);
		await expect(output).toHaveTextContent("Not clicked");
	},
};

export const AppliesVariantStyles: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
			<Button data-testid="button-default" variant="default">
				Default
			</Button>
			<Button data-testid="button-secondary" variant="secondary">
				Secondary
			</Button>
			<Button data-testid="button-outline" variant="outline">
				Outline
			</Button>
			<Button data-testid="button-ghost" variant="ghost">
				Ghost
			</Button>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const defaultButton = canvas.getByTestId("button-default");
		const secondaryButton = canvas.getByTestId("button-secondary");
		const outlineButton = canvas.getByTestId("button-outline");
		const ghostButton = canvas.getByTestId("button-ghost");

		await expect(defaultButton).toBeVisible();
		await expect(secondaryButton).toBeVisible();
		await expect(outlineButton).toBeVisible();
		await expect(ghostButton).toBeVisible();

		const defaultStyle = window.getComputedStyle(defaultButton);
		const outlineStyle = window.getComputedStyle(outlineButton);

		await expect(defaultStyle.backgroundColor).toBeTruthy();
		await expect(outlineStyle.borderWidth).toBeTruthy();
	},
};

export const AppliesSizeStyles: StoryObj<typeof Button> = {
	render: () => (
		<div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
			<Button data-testid="button-small" size="sm">
				Small
			</Button>
			<Button data-testid="button-default" size="default">
				Default
			</Button>
			<Button data-testid="button-large" size="lg">
				Large
			</Button>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const smallButton = canvas.getByTestId("button-small");
		const defaultButton = canvas.getByTestId("button-default");
		const largeButton = canvas.getByTestId("button-large");

		await expect(smallButton).toBeVisible();
		await expect(defaultButton).toBeVisible();
		await expect(largeButton).toBeVisible();

		const smallStyle = window.getComputedStyle(smallButton);
		const defaultStyle = window.getComputedStyle(defaultButton);
		const largeStyle = window.getComputedStyle(largeButton);

		await expect(smallStyle.paddingLeft).toBeTruthy();
		await expect(defaultStyle.paddingLeft).toBeTruthy();
		await expect(largeStyle.paddingLeft).toBeTruthy();
	},
};

export const AcceptsCustomClassName: StoryObj<typeof Button> = {
	render: () => (
		<Button
			data-testid="custom-button"
			className="custom-test-class"
			variant="default"
		>
			Custom Class Button
		</Button>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByTestId("custom-button");

		await expect(button).toBeVisible();
		await expect(button).toHaveClass("custom-test-class");
	},
};
