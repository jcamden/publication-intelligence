import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "../../empty-state";

const meta = {
	...defaultVrtMeta,
	title: "Components/EmptyState/tests/Visual Regression Tests",
	component: EmptyState,
	tags: ["visual-test"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
	globals: {
		defaultGlobals,
		viewport: { value: "mobile1", isRotated: true },
	},
	args: {
		icon: <Inbox size={64} />,
		title: "No projects yet",
		description:
			"Create your first project to start organizing your research and annotations.",
		action: <Button>Create Project</Button>,
	},
};
