import type { Meta, StoryObj } from "@storybook/react";
import { FormFooter } from "../form-footer";
import { longTextVariant } from "./shared";

const codeBlock = `import { FormFooter } from "@pubint/yaboujee";

const MyFormFooter = () => {
  return (
    <FormFooter
      text="Don't have an account?"
      linkText="Sign up"
      linkHref="/signup"
    />
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the FormFooter component at the bottom of authentication forms to provide users with navigation to related pages.

## Features
- **Contextual text**: Primary message to the user
- **Action link**: Highlighted link for navigation
- **Flexible styling**: Supports custom className for layout adjustments

## Common Use Cases
- Login forms: Link to signup page
- Signup forms: Link to login page
- Password reset: Link back to login

## Accessibility
The FormFooter uses Next.js Link component for proper client-side navigation and semantic HTML for accessibility.`;

export default {
	component: FormFooter,
	title: "Components/FormFooter",
	args: longTextVariant,
	argTypes: {
		text: {
			control: "text",
			description: "The main text content",
		},
		linkText: {
			control: "text",
			description: "The clickable link text",
		},
		linkHref: {
			control: "text",
			description: "The URL for the link",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
	parameters: {
		docs: {
			description: {
				component: `The FormFooter component provides a consistent way to add contextual links to forms.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof FormFooter>;

export const Default: StoryObj<typeof FormFooter> = {
	args: longTextVariant,
};

export const WithCustomStyling: StoryObj<typeof FormFooter> = {
	args: {
		...longTextVariant,
		className: "text-lg border-t pt-4",
	},
};
