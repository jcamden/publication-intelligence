import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectCard } from "../project-card";

const meta = {
	title: "UI/Projects/ProjectCard",
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
			id: "project-1",
			title: "Word Biblical Commentary: Daniel",
			description: "A comprehensive theological and exegetical analysis",
			project_dir: "wbc-daniel",
			source_document: {
				id: "doc-1",
				title: "Daniel Commentary",
				file_name: "wbc-daniel.pdf",
				file_size: 15728640,
				page_count: 456,
				storage_key: "storage-key-1",
			},
		},
		onDelete: fn(),
	},
};

export const WithoutDescription: Story = {
	args: {
		project: {
			id: "project-2",
			title: "NIV Study Bible",
			description: null,
			project_dir: "niv-study-bible",
			source_document: {
				id: "doc-2",
				title: "Study Bible",
				file_name: "niv-study-bible.pdf",
				file_size: 52428800,
				page_count: 2048,
				storage_key: "storage-key-2",
			},
		},
		onDelete: fn(),
	},
};

export const WithoutDocument: Story = {
	args: {
		project: {
			id: "project-3",
			title: "Empty Project",
			description: "A project without any documents yet",
			project_dir: "empty-project",
			source_document: null,
		},
		onDelete: fn(),
	},
};

export const SmallDocument: Story = {
	args: {
		project: {
			id: "project-4",
			title: "Short Commentary",
			description: "A brief theological commentary",
			project_dir: "short-commentary",
			source_document: {
				id: "doc-4",
				title: "Short Commentary",
				file_name: "short.pdf",
				file_size: 512000,
				page_count: 24,
				storage_key: "storage-key-4",
			},
		},
		onDelete: fn(),
	},
};

export const LargeDocument: Story = {
	args: {
		project: {
			id: "project-5",
			title: "Systematic Theology",
			description: "Complete systematic theology in multiple volumes",
			project_dir: "systematic-theology",
			source_document: {
				id: "doc-5",
				title: "Systematic Theology",
				file_name: "systematic-theology-complete.pdf",
				file_size: 157286400,
				page_count: 3500,
				storage_key: "storage-key-5",
			},
		},
		onDelete: fn(),
	},
};

export const LongTitle: Story = {
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

export const WithoutPageCount: Story = {
	args: {
		project: {
			id: "project-7",
			title: "Processing Document",
			description: "Document still being processed",
			project_dir: "processing-document",
			source_document: {
				id: "doc-7",
				title: "Processing",
				file_name: "processing.pdf",
				file_size: 5242880,
				page_count: null,
				storage_key: "storage-key-7",
			},
		},
		onDelete: fn(),
	},
};

export const WithoutFileSize: Story = {
	args: {
		project: {
			id: "project-8",
			title: "Unknown Size Document",
			description: "Document with unknown file size",
			project_dir: "unknown-size",
			source_document: {
				id: "doc-8",
				title: "Unknown Size",
				file_name: "unknown.pdf",
				file_size: null,
				page_count: 120,
				storage_key: "storage-key-8",
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

export const HoverState: Story = {
	args: {
		project: {
			id: "project-hover",
			title: "Hover Over Me",
			description: "Hover to see the delete button appear",
			project_dir: "hover-test",
			source_document: {
				id: "doc-hover",
				title: "Hover Test",
				file_name: "hover.pdf",
				file_size: 5242880,
				page_count: 100,
				storage_key: "storage-key-hover",
			},
		},
		onDelete: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Hover over the card to see the delete button appear in the top-right corner",
			},
		},
	},
};
