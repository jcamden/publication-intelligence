import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectCard } from "../project-card";

const meta = {
	title: "Projects/ProjectCard",
	component: ProjectCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		project: {
			id: "project-6",
			title:
				"The New International Commentary on the Old Testament: The Book of Isaiah Chapters 1-39",
			description:
				"An extensive verse-by-verse commentary on the first half of the prophetic book of Isaiah, including historical context, theological insights, and textual analysis",
			project_dir: "nicot-isaiah-1-39",
			source_document: {
				id: "doc-6",
				title: "NICOT Isaiah 1-39",
				file_name: "nicot-isaiah-1-39.pdf",
				file_size: 25165824,
				page_count: 678,
				storage_key: "storage-key-6",
			},
		},
		onDelete: fn(),
	},
};

export const GridLayout: StoryObj<typeof ProjectCard> = {
	render: () => (
		<div className="grid grid-cols-3 gap-4 max-w-[900px]">
			<ProjectCard
				project={{
					id: "grid-1",
					title: "Commentary 1",
					description: "First commentary",
					project_dir: "commentary-1",
					source_document: {
						id: "doc-g1",
						title: "Commentary 1",
						file_name: "commentary1.pdf",
						file_size: 10485760,
						page_count: 250,
						storage_key: "storage-key-g1",
					},
				}}
				onDelete={fn()}
			/>
			<ProjectCard
				project={{
					id: "grid-2",
					title: "Commentary 2",
					description: "Second commentary",
					project_dir: "commentary-2",
					source_document: {
						id: "doc-g2",
						title: "Commentary 2",
						file_name: "commentary2.pdf",
						file_size: 15728640,
						page_count: 380,
						storage_key: "storage-key-g2",
					},
				}}
				onDelete={fn()}
			/>
			<ProjectCard
				project={{
					id: "grid-3",
					title: "Commentary 3",
					description: null,
					project_dir: "commentary-3",
					source_document: {
						id: "doc-g3",
						title: "Commentary 3",
						file_name: "commentary3.pdf",
						file_size: 8388608,
						page_count: 195,
						storage_key: "storage-key-g3",
					},
				}}
				onDelete={fn()}
			/>
		</div>
	),
};
