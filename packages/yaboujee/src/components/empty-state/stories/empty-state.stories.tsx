import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Inbox } from "lucide-react";
import { EmptyState } from "../empty-state";

const meta = {
	title: "Components/EmptyState",
	component: EmptyState,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "No items found",
	},
};

export const WithDescription: Story = {
	args: {
		title: "No entries yet",
		description: "Get started by creating your first entry.",
	},
};

export const WithIcon: Story = {
	args: {
		icon: <Inbox size={64} />,
		title: "Your inbox is empty",
		description: "All caught up! There are no new messages.",
	},
};

export const WithAction: Story = {
	args: {
		icon: <FileText size={64} />,
		title: "No documents",
		description: "Upload your first document to get started.",
		action: <Button>Upload Document</Button>,
	},
};

export const Complete: Story = {
	args: {
		icon: <Inbox size={64} />,
		title: "No projects yet",
		description:
			"Create your first project to start organizing your research and annotations.",
		action: <Button>Create Project</Button>,
	},
};

export const MinimalWithAction: Story = {
	args: {
		title: "No results",
		action: <Button variant="outline">Clear Filters</Button>,
	},
};
