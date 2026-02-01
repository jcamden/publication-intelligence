import type { Meta, StoryObj } from "@storybook/react";
import { SignupForm } from "../signup-form";

const codeBlock = `import { SignupForm } from "@/components/auth/signup-form";

const MyPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignupForm />
    </div>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
The SignupForm component provides a complete user registration flow for new users.

## Features
- Optional name field
- Email and password validation
- Real-time form validation feedback
- Loading states during registration
- Error handling with user-friendly messages
- Responsive design that works on all devices
- Link to sign-in page for existing users

## Form Validation
- Name: Optional field
- Email: Must be a valid email address
- Password: Minimum 8 characters required

## Accessibility
The form includes proper labels, ARIA attributes, and keyboard navigation support.`;

export default {
	component: SignupForm,
	title: "Signup/SignupForm",
	decorators: [
		(Story) => (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Story />
			</div>
		),
	],
	parameters: {
		docs: {
			description: {
				component: `The SignupForm component handles user registration with optional name, email, and password.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "fullscreen",
	},
} satisfies Meta<typeof SignupForm>;

export const Default: StoryObj<typeof SignupForm> = {};
