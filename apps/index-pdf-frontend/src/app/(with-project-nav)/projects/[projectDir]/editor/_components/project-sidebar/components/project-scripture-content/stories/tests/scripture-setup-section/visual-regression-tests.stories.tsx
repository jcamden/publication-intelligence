import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { AddEntriesFromBooksModal } from "../../../add-entries-from-books-modal";

const meta: Meta<typeof AddEntriesFromBooksModal> = {
	...defaultVrtMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectScriptureContent/AddEntriesFromBooksModal/tests/Visual Regression Tests",
	component: AddEntriesFromBooksModal,
	parameters: {
		...defaultVrtMeta.parameters,
		layout: "centered",
	},
	args: {
		open: true,
		onClose: () => {},
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-scripture-id",
		onBootstrapSuccess: () => {},
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	globals: {
		...defaultGlobals,
	},
};

export const DarkMode: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
};
