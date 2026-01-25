import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../index";
import {
	defaultArgs,
	defaultVariantProps,
	withContentsAndElevationProps,
	withContentsProps,
} from "./shared";

const codeBlock = `import { Card } from "@/components/card";

const MyCard = () => {
  return (
    <Card elevation="low">
      <div>
        <h1>Title</h1>
        <span>Example Body</span>
      </div>
    </Card>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use cases for the Card component include document previews, file information display, or grouping related content in a visually distinct container.

## Padding
The content included in the Card component has consistent 24px padding on all sides by default.

## Variants
The Card supports three elevation levels: low, medium, and high. Each provides a different depth appearance using box shadows.`;

export default {
	component: Card,
	title: "Components/Card",
	args: defaultArgs,
	argTypes: {
		elevation: {
			control: {
				type: "select",
			},
			options: ["low", "medium", "high", undefined],
			description: "The elevation level of the card",
		},
		children: {
			control: false,
			description: "The content to render inside the card",
		},
	},
	parameters: {
		docs: {
			description: {
				component: `The Card component is a flexible container for content. It can be customized with different elevation levels and styled to fit your design requirements.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof Card>;

export const Default: StoryObj<typeof Card> = {
	args: defaultVariantProps,
};

export const WithContents: StoryObj<typeof Card> = {
	args: withContentsProps,
};

export const WithContentsAndElevation: StoryObj<typeof Card> = {
	args: withContentsAndElevationProps,
};

export const LowElevation: StoryObj<typeof Card> = {
	args: {
		...withContentsProps,
		elevation: "low",
	},
};

export const MediumElevation: StoryObj<typeof Card> = {
	args: {
		...withContentsProps,
		elevation: "medium",
	},
};

export const HighElevation: StoryObj<typeof Card> = {
	args: {
		...withContentsProps,
		elevation: "high",
	},
};
