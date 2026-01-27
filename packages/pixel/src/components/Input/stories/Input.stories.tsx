import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "../Input";

const codeBlock = `import { Input } from "@pubint/pixel";

const MyInput = () => {
  const [value, setValue] = useState("");
  
  return (
    <Input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
      placeholder="Enter text..."
    />
  );
};
`;

const additionalMarkdownDescription = `
## Use cases
Use the Input component for text entry, forms, search fields, and user data collection.

## Variants
- **Default**: Standard input style
- **Success**: Indicates valid input
- **Error**: Indicates invalid input
- **Warning**: Indicates attention needed

## Sizes
The Input supports three sizes: sm, md, and lg for different contexts.

## Accessibility
Built with Base UI, the Input component includes proper ARIA attributes and keyboard navigation support.`;

export default {
	component: Input,
	title: "Components/Input",
	args: {
		placeholder: "Enter text...",
		size: "md",
		variant: "default",
		disabled: false,
		required: false,
	},
	argTypes: {
		size: {
			control: {
				type: "select",
			},
			options: ["sm", "md", "lg"],
			description: "The size of the input",
		},
		variant: {
			control: {
				type: "select",
			},
			options: ["default", "success", "error", "warning"],
			description: "The visual style variant of the input",
		},
		type: {
			control: {
				type: "select",
			},
			options: ["text", "email", "password", "number", "tel", "url"],
			description: "The type of input",
		},
		disabled: {
			control: {
				type: "boolean",
			},
			description: "Whether the input is disabled",
		},
		required: {
			control: {
				type: "boolean",
			},
			description: "Whether the input is required",
		},
		placeholder: {
			control: "text",
			description: "Placeholder text",
		},
		onChange: {
			action: "changed",
			description: "Change event handler",
		},
	},
	parameters: {
		docs: {
			description: {
				component: `The Input component is built on Base UI and provides a flexible, accessible input with multiple variants and sizes.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
	},
} satisfies Meta<typeof Input>;

export const Default: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const WithValue: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("Hello World");
		return (
			<Input
				{...args}
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Success: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("valid@email.com");
		return (
			<Input
				{...args}
				variant="success"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const ErrorState: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("invalid-email");
		return (
			<Input
				{...args}
				variant="error"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Warning: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				variant="warning"
				placeholder="This field needs attention"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Small: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				size="sm"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Medium: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				size="md"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Large: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				size="lg"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Disabled: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("Disabled input");
		return (
			<Input
				{...args}
				disabled
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Password: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				type="password"
				placeholder="Enter password"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const Email: StoryObj<typeof Input> = {
	render: (args) => {
		const [value, setValue] = useState("");
		return (
			<Input
				{...args}
				type="email"
				placeholder="Enter email"
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
		);
	},
};

export const AllVariants: StoryObj<typeof Input> = {
	render: () => {
		const [value1, setValue1] = useState("");
		const [value2, setValue2] = useState("");
		const [value3, setValue3] = useState("");
		const [value4, setValue4] = useState("");

		return (
			<div className="flex flex-col gap-4 max-w-md">
				<Input
					variant="default"
					placeholder="Default"
					value={value1}
					onChange={(e) => setValue1(e.target.value)}
				/>
				<Input
					variant="success"
					placeholder="Success"
					value={value2}
					onChange={(e) => setValue2(e.target.value)}
				/>
				<Input
					variant="error"
					placeholder="Error"
					value={value3}
					onChange={(e) => setValue3(e.target.value)}
				/>
				<Input
					variant="warning"
					placeholder="Warning"
					value={value4}
					onChange={(e) => setValue4(e.target.value)}
				/>
			</div>
		);
	},
};

export const AllSizes: StoryObj<typeof Input> = {
	render: () => {
		const [value1, setValue1] = useState("");
		const [value2, setValue2] = useState("");
		const [value3, setValue3] = useState("");

		return (
			<div className="flex flex-col gap-4 max-w-md">
				<Input
					size="sm"
					placeholder="Small"
					value={value1}
					onChange={(e) => setValue1(e.target.value)}
				/>
				<Input
					size="md"
					placeholder="Medium"
					value={value2}
					onChange={(e) => setValue2(e.target.value)}
				/>
				<Input
					size="lg"
					placeholder="Large"
					value={value3}
					onChange={(e) => setValue3(e.target.value)}
				/>
			</div>
		);
	},
};
