import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../../Button";
import { Modal } from "../Modal";

const codeBlock = `import { Modal, Button } from "@pubint/pixel";
import { useState } from "react";

const MyModal = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal 
        open={open} 
        onClose={() => setOpen(false)}
        title="My Modal"
      >
        <p>Modal content goes here.</p>
      </Modal>
    </>
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the Modal component for dialogs, confirmations, forms, and displaying content that requires user focus.

## Sizes
The Modal supports five sizes: sm, md, lg, xl, and full for different content needs.

## Features
- **Backdrop**: Semi-transparent overlay with blur effect
- **Close button**: Optional X button in header
- **Footer**: Optional footer section for actions
- **Keyboard support**: ESC key to close

## Accessibility
Built with Base UI, the Modal component includes proper ARIA attributes, focus management, and keyboard navigation support.`;

export default {
	component: Modal,
	title: "Components/Modal",
	parameters: {
		docs: {
			description: {
				component: `The Modal component is built on Base UI Dialog and provides a flexible, accessible modal dialog with multiple sizes.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof Modal>;

export const Default: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal</Button>
				<Modal open={open} onClose={() => setOpen(false)} title="Default Modal">
					<p>This is a default modal with medium size.</p>
					<p className="mt-2">
						Click the backdrop, press ESC, or click the X button to close.
					</p>
				</Modal>
			</>
		);
	},
};

export const WithFooter: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal with Footer</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="Confirm Action"
					footer={
						<>
							<Button variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button variant="primary" onClick={() => setOpen(false)}>
								Confirm
							</Button>
						</>
					}
				>
					<p>Are you sure you want to proceed with this action?</p>
				</Modal>
			</>
		);
	},
};

export const SmallSize: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Small Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="Small Modal"
					size="sm"
				>
					<p>This is a small modal.</p>
				</Modal>
			</>
		);
	},
};

export const LargeSize: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Large Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="Large Modal"
					size="lg"
				>
					<p>This is a large modal with more content space.</p>
					<p className="mt-2">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
				</Modal>
			</>
		);
	},
};

export const ExtraLargeSize: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open XL Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="Extra Large Modal"
					size="xl"
				>
					<p>This is an extra large modal for complex content.</p>
					<div className="mt-4 space-y-2">
						{[1, 2, 3, 4].map((i) => (
							<p key={i}>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
							</p>
						))}
					</div>
				</Modal>
			</>
		);
	},
};

export const NoCloseButton: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>
					Open Modal Without Close Button
				</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="No Close Button"
					showCloseButton={false}
					footer={<Button onClick={() => setOpen(false)}>Close</Button>}
				>
					<p>
						This modal has no X button. Use the backdrop, ESC key, or the footer
						button to close.
					</p>
				</Modal>
			</>
		);
	},
};

export const NoTitle: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Modal Without Title</Button>
				<Modal open={open} onClose={() => setOpen(false)}>
					<div className="text-center">
						<h2 className="text-2xl font-bold mb-4">Custom Header</h2>
						<p>
							This modal has no built-in title, so you can create your own
							header layout.
						</p>
					</div>
				</Modal>
			</>
		);
	},
};

export const WithForm: StoryObj<typeof Modal> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Form Modal</Button>
				<Modal
					open={open}
					onClose={() => setOpen(false)}
					title="Create Account"
					footer={
						<>
							<Button variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button variant="primary" onClick={() => setOpen(false)}>
								Create
							</Button>
						</>
					}
				>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="name-input"
								className="block text-sm font-medium mb-1"
							>
								Name
							</label>
							<input
								id="name-input"
								type="text"
								className="w-full px-3 py-2 border rounded-lg"
								placeholder="Enter your name"
							/>
						</div>
						<div>
							<label
								htmlFor="email-input"
								className="block text-sm font-medium mb-1"
							>
								Email
							</label>
							<input
								id="email-input"
								type="email"
								className="w-full px-3 py-2 border rounded-lg"
								placeholder="Enter your email"
							/>
						</div>
					</div>
				</Modal>
			</>
		);
	},
};
