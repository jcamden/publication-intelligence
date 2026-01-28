import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../Logo";

const meta = {
	title: "Components/Logo",
	component: Logo,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg", "xl"],
			description: "Size of the logo",
		},
		variant: {
			control: "select",
			options: ["primary", "gradient", "light", "dark"],
			description: "Visual style variant",
		},
		href: {
			control: "text",
			description: "Optional link URL",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: "primary",
		size: "md",
	},
};

export const Gradient: Story = {
	args: {
		variant: "gradient",
		size: "md",
	},
};

export const Light: Story = {
	args: {
		variant: "light",
		size: "md",
	},
	parameters: {
		backgrounds: { default: "dark" },
	},
};

export const Dark: Story = {
	args: {
		variant: "dark",
		size: "md",
	},
};

export const Small: Story = {
	args: {
		variant: "primary",
		size: "sm",
	},
};

export const Large: Story = {
	args: {
		variant: "gradient",
		size: "lg",
	},
};

export const ExtraLarge: Story = {
	args: {
		variant: "gradient",
		size: "xl",
	},
};

export const AsLink: Story = {
	args: {
		variant: "gradient",
		size: "md",
		href: "/",
	},
};

export const AllSizes: Story = {
	render: () => (
		<div className="flex flex-col gap-8 items-start">
			<Logo size="sm" variant="gradient" />
			<Logo size="md" variant="gradient" />
			<Logo size="lg" variant="gradient" />
			<Logo size="xl" variant="gradient" />
		</div>
	),
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-8 items-start">
			<Logo variant="primary" />
			<Logo variant="gradient" />
			<Logo variant="dark" />
		</div>
	),
};
