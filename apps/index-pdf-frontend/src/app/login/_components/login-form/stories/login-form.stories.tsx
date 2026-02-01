import type { Meta, StoryObj } from "@storybook/react";
import { LoginForm } from "../login-form";

const codeBlock = `import { LoginForm } from "@/components/auth/login-form";

const MyPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
The LoginForm component provides a complete authentication flow for users to sign in to the application.

## Features
- Email and password validation
- Real-time form validation feedback
- Loading states during authentication
- Error handling with user-friendly messages
- Responsive design that works on all devices
- Link to sign-up page for new users

## Form Validation
- Email: Must be a valid email address
- Password: Minimum 8 characters required

## Accessibility
The form includes proper labels, ARIA attributes, and keyboard navigation support.`;

export default {
	component: LoginForm,
	title: "Login/LoginForm",
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
				component: `The LoginForm component handles user authentication with email and password.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "fullscreen",
	},
} satisfies Meta<typeof LoginForm>;

export const Default: StoryObj<typeof LoginForm> = {};
