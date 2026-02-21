import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../logo";

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

export const AllVariants: Story = {
	render: () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "32px",
				padding: "32px",
			}}
		>
			<div>
				<Logo variant="primary" size="md" />
			</div>
			<div>
				<Logo variant="gradient" size="md" />
			</div>
			<div>
				<Logo variant="dark" size="md" />
			</div>
			<div className="flex">
				<div className="bg-black">
					<Logo variant="light" size="md" />
				</div>
			</div>
		</div>
	),
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
