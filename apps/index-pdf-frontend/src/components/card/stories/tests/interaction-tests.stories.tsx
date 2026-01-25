import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Card } from "../../index";

export default {
	title: "Components/Card/tests/Interaction Tests",
	component: Card,
	tags: ["interaction-test"],
	parameters: {
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["children", "elevation"],
		},
	},
} satisfies Meta<typeof Card>;

export const RendersEmptyByDefault: StoryObj<typeof Card> = {
	args: { children: undefined },
	render: (args) => <Card {...args} data-testid="empty-card" />,
	play: async (args) => {
		const canvas = within(args.canvasElement);
		const card = canvas.getByTestId("empty-card");

		await expect(card).toBeTruthy();
		await expect(card).toBeVisible();
		await expect(card).toBeEmptyDOMElement();
	},
};

export const RendersPassedChildren: StoryObj<typeof Card> = {
	render: (args) => (
		<Card data-testid="card-content" elevation={args.elevation}>
			<div className="flex flex-col">
				<h3>Document Title</h3>
				<p>This is the document body content</p>
				<p>Footer information</p>
			</div>
		</Card>
	),
	play: async (args) => {
		const canvas = within(args.canvasElement);
		const card = canvas.getByTestId("card-content");
		const cardHeader = canvas.getByRole("heading", { name: "Document Title" });
		const cardBody = canvas.getByText("This is the document body content");
		const cardFooter = canvas.getByText("Footer information");

		await expect(card).toBeTruthy();
		await expect(card).toBeVisible();
		await expect(card).toContainElement(cardHeader);
		await expect(card).toContainElement(cardBody);
		await expect(card).toContainElement(cardFooter);
	},
};

export const AppliesElevationStyles: StoryObj<typeof Card> = {
	render: () => (
		<div className="flex gap-6 flex-wrap">
			<Card data-testid="card-low" elevation="low">
				<p>Low Elevation</p>
			</Card>
			<Card data-testid="card-medium" elevation="medium">
				<p>Medium Elevation</p>
			</Card>
			<Card data-testid="card-high" elevation="high">
				<p>High Elevation</p>
			</Card>
		</div>
	),
	play: async (args) => {
		const canvas = within(args.canvasElement);
		const lowCard = canvas.getByTestId("card-low");
		const mediumCard = canvas.getByTestId("card-medium");
		const highCard = canvas.getByTestId("card-high");

		await expect(lowCard).toBeVisible();
		await expect(mediumCard).toBeVisible();
		await expect(highCard).toBeVisible();

		const lowStyle = window.getComputedStyle(lowCard);
		const mediumStyle = window.getComputedStyle(mediumCard);
		const highStyle = window.getComputedStyle(highCard);

		await expect(lowStyle.boxShadow).toBeTruthy();
		await expect(mediumStyle.boxShadow).toBeTruthy();
		await expect(highStyle.boxShadow).toBeTruthy();
	},
};

export const RespondsToCustomClassName: StoryObj<typeof Card> = {
	render: () => (
		<Card data-testid="custom-card" className="bg-gray-100 rounded-2xl p-8">
			<p>Custom styled card</p>
		</Card>
	),
	play: async (args) => {
		const canvas = within(args.canvasElement);
		const card = canvas.getByTestId("custom-card");

		await expect(card).toBeVisible();
		await expect(card).toHaveClass("bg-gray-100");
		await expect(card).toHaveClass("rounded-2xl");
		await expect(card).toHaveClass("p-8");
	},
};
