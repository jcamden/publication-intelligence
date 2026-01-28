import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../index";

const codeBlock = `import { Button } from "@/components/button";

const MyButton = () => {
  return (
    <Button variant="default" size="default" onClick={() => console.log("Clicked!")}>
      Click me
    </Button>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the Button component for user interactions such as form submissions, navigation, and triggering actions.

## Variants
- **Default**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Outline**: Alternative style with border
- **Ghost**: Minimal style for tertiary actions
- **Destructive**: For destructive actions
- **Link**: Link-style buttons

## Sizes
The Button supports multiple sizes: xs, sm, default, and lg for different contexts.

## Accessibility
Built with Base UI, the Button component includes proper ARIA attributes and keyboard navigation support.`;

export default {
	component: Button,
	title: "Components/Button",
	args: {
		children: "Button",
		variant: "default",
		size: "default",
		disabled: false,
	},
	argTypes: {
		variant: {
			control: {
				type: "select",
			},
			options: [
				"default",
				"secondary",
				"outline",
				"ghost",
				"destructive",
				"link",
			],
			description: "The visual style variant of the button",
		},
		size: {
			control: {
				type: "select",
			},
			options: ["xs", "sm", "default", "lg"],
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

export const Default: StoryObj<typeof Button> = {
	args: {
		variant: "default",
		children: "Default Button",
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

export const Destructive: StoryObj<typeof Button> = {
	args: {
		variant: "destructive",
		children: "Destructive Button",
	},
};

export const ExtraSmall: StoryObj<typeof Button> = {
	args: {
		size: "xs",
		children: "Extra Small",
	},
};

export const Small: StoryObj<typeof Button> = {
	args: {
		size: "sm",
		children: "Small Button",
	},
};

export const DefaultSize: StoryObj<typeof Button> = {
	args: {
		size: "default",
		children: "Default Size",
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
			<div className="flex gap-4 items-center">
				<Button variant="default">Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
			</div>
		</div>
	),
};

export const AllSizes: StoryObj<typeof Button> = {
	render: () => (
		<div className="flex gap-4 items-center">
			<Button size="xs">Extra Small</Button>
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
		</div>
	),
};
