import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Alert } from "../../alert";

export default {
	title: "Components/Alert/tests/Interaction Tests",
	component: Alert,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
	},
} satisfies Meta<typeof Alert>;

export const RendersWithContent: StoryObj<typeof Alert> = {
	args: { children: "Test alert message" },
	render: (args) => <Alert {...args} data-testid="alert" />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const alert = canvas.getByTestId("alert");

		await expect(alert).toBeTruthy();
		await expect(alert).toBeVisible();
		await expect(alert).toHaveTextContent("Test alert message");
	},
};

export const AppliesVariantStyles: StoryObj<typeof Alert> = {
	render: () => (
		<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
			<Alert data-testid="alert-info" variant="info">
				Info message
			</Alert>
			<Alert data-testid="alert-success" variant="success">
				Success message
			</Alert>
			<Alert data-testid="alert-warning" variant="warning">
				Warning message
			</Alert>
			<Alert data-testid="alert-error" variant="error">
				Error message
			</Alert>
		</div>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const infoAlert = canvas.getByTestId("alert-info");
		const successAlert = canvas.getByTestId("alert-success");
		const warningAlert = canvas.getByTestId("alert-warning");
		const errorAlert = canvas.getByTestId("alert-error");

		await expect(infoAlert).toBeVisible();
		await expect(successAlert).toBeVisible();
		await expect(warningAlert).toBeVisible();
		await expect(errorAlert).toBeVisible();

		const infoStyle = window.getComputedStyle(infoAlert);
		const successStyle = window.getComputedStyle(successAlert);

		await expect(infoStyle.backgroundColor).toBeTruthy();
		await expect(successStyle.backgroundColor).toBeTruthy();
	},
};

export const AcceptsCustomClassName: StoryObj<typeof Alert> = {
	render: () => (
		<Alert
			data-testid="custom-alert"
			className="custom-test-class"
			variant="info"
		>
			Custom class alert
		</Alert>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const alert = canvas.getByTestId("custom-alert");

		await expect(alert).toBeVisible();
		await expect(alert).toHaveClass("custom-test-class");
	},
};

export const RendersComplexChildren: StoryObj<typeof Alert> = {
	render: () => (
		<Alert data-testid="complex-alert" variant="info">
			<div>
				<strong data-testid="strong-text">Important:</strong>
				<span data-testid="span-text"> This is a complex message</span>
			</div>
		</Alert>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const alert = canvas.getByTestId("complex-alert");
		const strongText = canvas.getByTestId("strong-text");
		const spanText = canvas.getByTestId("span-text");

		await expect(alert).toBeVisible();
		await expect(strongText).toBeVisible();
		await expect(spanText).toBeVisible();
		await expect(strongText).toHaveTextContent("Important:");
	},
};

export const HandlesLongContent: StoryObj<typeof Alert> = {
	render: () => (
		<Alert data-testid="long-alert" variant="warning">
			This is a very long alert message that contains a lot of text to test how
			the component handles wrapping and overflow. It should display properly
			without breaking the layout.
		</Alert>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const alert = canvas.getByTestId("long-alert");

		await expect(alert).toBeVisible();
		await expect(alert.textContent?.length).toBeGreaterThan(50);
	},
};
