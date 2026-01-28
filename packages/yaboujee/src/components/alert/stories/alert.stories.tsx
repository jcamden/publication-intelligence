import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "../alert";
import { AllVariantsStack } from "./shared";

const codeBlock = `import { Alert } from "@pubint/yaboujee";

const MyAlert = () => {
  return (
    <Alert variant="info">
      This is an informational message.
    </Alert>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the Alert component to display important messages, notifications, errors, warnings, or success states to users.

## Variants
- **Info**: General informational messages (default)
- **Success**: Success confirmations and positive feedback
- **Warning**: Caution messages and potential issues
- **Error**: Error messages and critical issues

## Accessibility
The Alert component uses semantic HTML and proper color contrast for accessibility.`;

export default {
	component: Alert,
	title: "Components/Alert",
	args: {
		children: "This is an alert message",
		variant: "info",
	},
	argTypes: {
		variant: {
			control: {
				type: "select",
			},
			options: ["info", "success", "warning", "error"],
			description: "The visual style variant of the alert",
		},
		children: {
			control: "text",
			description: "The content to render inside the alert",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
	parameters: {
		docs: {
			description: {
				component: `The Alert component provides a simple way to display contextual feedback messages to users.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof Alert>;

export const AllVariants: StoryObj<typeof Alert> = {
	render: () => <AllVariantsStack />,
};

export const AllVariantsWithCustomStyle: StoryObj<typeof Alert> = {
	render: () => <AllVariantsStack customStyle="shadow-lg" />,
};
