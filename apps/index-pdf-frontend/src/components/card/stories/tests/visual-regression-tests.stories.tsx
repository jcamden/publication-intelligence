import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../card";

const defaultVrtConfig = {
	parameters: {
		chromatic: { disableSnapshot: false },
	},
};

const viewportConfig = {
	small: {
		parameters: {
			viewport: {
				defaultViewport: "mobile1",
			},
		},
	},
};

export default {
	title: "Components/Card/tests/Visual Regression Tests",
	component: Card,
	tags: ["visual-regression"],
	parameters: {
		...defaultVrtConfig.parameters,
		previewTabs: { "storybook/docs/panel": { hidden: true } },
		controls: {
			exclude: ["children", "elevation"],
		},
	},
} satisfies Meta<typeof Card>;

export const Empty: StoryObj<typeof Card> = {
	render: () => <Card data-testid="empty-card" />,
	args: {
		children: null,
	},
};

export const WithLowElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "low",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithMediumElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "medium",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithHighElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "high",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithContents: StoryObj<typeof Card> = {
	parameters: {
		controls: {
			exclude: ["elevation", "children"],
		},
	},
	args: {
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithContentsAndLowElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "low",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithContentsAndMediumElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "medium",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const WithContentsAndHighElevation: StoryObj<typeof Card> = {
	args: {
		elevation: "high",
		children: (
			<div>
				<h1>Title</h1>
				<span>Card test body</span>
			</div>
		),
	},
};

export const SmallViewport: StoryObj<typeof Card> = {
	parameters: {
		...viewportConfig.small.parameters,
		controls: {
			exclude: ["elevation", "children"],
		},
	},
	args: {
		children: (
			<div>
				<h1>Title</h1>
				<span>
					Card test body with longer text so we can see how it breaks lines
					inside the card body and adapts to smaller viewport sizes
				</span>
			</div>
		),
	},
};

export const LongContent: StoryObj<typeof Card> = {
	parameters: {
		controls: {
			exclude: ["elevation", "children"],
		},
	},
	args: {
		elevation: "low",
		children: (
			<div className="flex flex-col gap-4">
				<h1>Document Analysis Report</h1>
				<p>
					This is a detailed analysis of the document content. Lorem ipsum dolor
					sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
					incididunt ut labore et dolore magna aliqua.
				</p>
				<p>
					Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
					nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
					reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
					pariatur.
				</p>
				<button type="button" className="text-blue-600">
					Read more
				</button>
			</div>
		),
	},
};

export const MultipleCardsLayout: StoryObj<typeof Card> = {
	render: () => (
		<div className="grid grid-cols-2 gap-6 p-6">
			<Card elevation="low">
				<h3>Document 1</h3>
				<p>First document preview</p>
			</Card>
			<Card elevation="low">
				<h3>Document 2</h3>
				<p>Second document preview</p>
			</Card>
			<Card elevation="medium">
				<h3>Document 3</h3>
				<p>Third document preview</p>
			</Card>
			<Card elevation="high">
				<h3>Document 4</h3>
				<p>Fourth document preview</p>
			</Card>
		</div>
	),
};

export const DarkBackground: StoryObj<typeof Card> = {
	parameters: {
		backgrounds: { default: "dark" },
	},
	args: {
		elevation: "high",
		children: (
			<div>
				<h2>Card on Dark Background</h2>
				<p>Testing card visibility on dark backgrounds</p>
			</div>
		),
	},
};
