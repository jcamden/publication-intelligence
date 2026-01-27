import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";

const codeBlock = `import { Button } from "@pubint/pixel";

const MyButton = () => {
  return (
    <Button variant="primary" size="md" onClick={() => console.log("Clicked!")}>
      Click me
    </Button>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the Button component for user interactions such as form submissions, navigation, and triggering actions.

## Variants
- **Primary**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Outline**: Alternative style with border
- **Ghost**: Minimal style for tertiary actions
- **Danger**: Destructive actions

## Sizes
The Button supports three sizes: sm, md, and lg for different contexts.

## Accessibility
Built with Base UI, the Button component includes proper ARIA attributes and keyboard navigation support.`;

export default {
	component: Button,
	title: "Components/Button",
	args: {
		children: "Button",
		variant: "primary",
		size: "md",
		disabled: false,
	},
	argTypes: {
		variant: {
			control: {
				type: "select",
			},
			options: ["primary", "secondary", "outline", "ghost", "danger"],
			description: "The visual style variant of the button",
		},
		size: {
			control: {
				type: "select",
			},
			options: ["sm", "md", "lg"],
			description: "The size of the button",
		},
		disabled: {
			control: {
				type: "boolean",
			},
			description: "Whether the button is disabled",
		},
		children: {
			control: "text",
			description: "The content to render inside the button",
		},
		onClick: {
			action: "clicked",
			description: "Click event handler",
		},
	},
	parameters: {
		docs: {
			description: {
				component: `The Button component is built on Base UI and provides a flexible, accessible button with multiple variants and sizes.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof Button>;

export const Primary: StoryObj<typeof Button> = {
	args: {
		variant: "primary",
		children: "Primary Button",
	},
};

export const Secondary: StoryObj<typeof Button> = {
	args: {
		variant: "secondary",
		children: "Secondary Button",
	},
};

export const Outline: StoryObj<typeof Button> = {
	args: {
		variant: "outline",
		children: "Outline Button",
	},
};

export const Ghost: StoryObj<typeof Button> = {
	args: {
		variant: "ghost",
		children: "Ghost Button",
	},
};

export const Danger: StoryObj<typeof Button> = {
	args: {
		variant: "danger",
		children: "Danger Button",
	},
};

export const Small: StoryObj<typeof Button> = {
	args: {
		size: "sm",
		children: "Small Button",
	},
};

export const Medium: StoryObj<typeof Button> = {
	args: {
		size: "md",
		children: "Medium Button",
	},
};

export const Large: StoryObj<typeof Button> = {
	args: {
		size: "lg",
		children: "Large Button",
	},
};

export const Disabled: StoryObj<typeof Button> = {
	args: {
		disabled: true,
		children: "Disabled Button",
	},
};

export const AllVariants: StoryObj<typeof Button> = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4 items-center flex-wrap">
				<Button variant="primary">Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="danger">Danger</Button>
			</div>
		</div>
	),
};

export const AllSizes: StoryObj<typeof Button> = {
	render: () => (
		<div className="flex gap-4 items-center flex-wrap">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};
