import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ProjectGrid } from "../project-grid";

const meta = {
	title: "Projects/ProjectGrid",
	component: ProjectGrid,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ProjectGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockProjects = [
	{
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
	{
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
	{
		id: "project-3",
		title: "Systematic Theology",
		description: "Complete systematic theology in multiple volumes",
		project_dir: "systematic-theology",
		source_document: {
			id: "doc-3",
			title: "Systematic Theology",
			file_name: "systematic-theology.pdf",
			file_size: 157286400,
			page_count: 3500,
			storage_key: "storage-key-3",
		},
	},
];

export const Default: Story = {
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: fn(),
	},
};

export const Empty: Story = {
	args: {
		projects: [],
		isLoading: false,
		onDeleteClick: fn(),
		onCreateClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "Empty state shown when there are no projects",
			},
		},
	},
};

export const Loading: Story = {
	args: {
		projects: [],
		isLoading: true,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "Loading state with spinner",
			},
		},
	},
};

export const SingleProject: Story = {
	args: {
		projects: [mockProjects[0]],
		isLoading: false,
		onDeleteClick: fn(),
	},
};

export const ManyProjects: Story = {
	args: {
		projects: [
			...mockProjects,
			{
				id: "project-4",
				title: "New Testament Commentary",
				description: "Verse-by-verse analysis",
				project_dir: "nt-commentary",
				source_document: {
					id: "doc-4",
					title: "NT Commentary",
					file_name: "nt-commentary.pdf",
					file_size: 25165824,
					page_count: 678,
					storage_key: "storage-key-4",
				},
			},
			{
				id: "project-5",
				title: "Old Testament Survey",
				description: "Overview of OT books",
				project_dir: "ot-survey",
				source_document: {
					id: "doc-5",
					title: "OT Survey",
					file_name: "ot-survey.pdf",
					file_size: 10485760,
					page_count: 320,
					storage_key: "storage-key-5",
				},
			},
			{
				id: "project-6",
				title: "Church History",
				description: null,
				project_dir: "church-history",
				source_document: {
					id: "doc-6",
					title: "Church History",
					file_name: "church-history.pdf",
					file_size: 31457280,
					page_count: 892,
					storage_key: "storage-key-6",
				},
			},
		],
		isLoading: false,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "Grid with multiple projects showing responsive layout",
			},
		},
	},
};

export const WithoutDocuments: Story = {
	args: {
		projects: [
			{
				id: "project-empty-1",
				title: "Empty Project 1",
				description: "No document uploaded yet",
				project_dir: "empty-1",
				source_document: null,
			},
			{
				id: "project-empty-2",
				title: "Empty Project 2",
				description: null,
				project_dir: "empty-2",
				source_document: null,
			},
			mockProjects[0],
		],
		isLoading: false,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "Mix of projects with and without documents",
			},
		},
	},
};

export const ResponsiveLayout: Story = {
	render: (args) => (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-semibold mb-4">Mobile (1 column)</h3>
				<div className="max-w-[400px]">
					<ProjectGrid {...args} />
				</div>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4">Tablet (2 columns)</h3>
				<div className="max-w-[768px]">
					<ProjectGrid {...args} />
				</div>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4">Desktop (3 columns)</h3>
				<div className="max-w-[1200px]">
					<ProjectGrid {...args} />
				</div>
			</div>
		</div>
	),
	args: {
		projects: mockProjects,
		isLoading: false,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Grid layout adapts to different screen sizes: 1 column on mobile, 2 on tablet, 3 on desktop",
			},
		},
	},
};

export const LongTitlesAndDescriptions: Story = {
	args: {
		projects: [
			{
				id: "project-long-1",
				title:
					"The New International Commentary on the Old Testament: The Book of Isaiah Chapters 1-39",
				description:
					"An extensive verse-by-verse commentary on the first half of the prophetic book of Isaiah, including historical context, theological insights, and detailed textual analysis with cross-references",
				project_dir: "nicot-isaiah-1-39",
				source_document: {
					id: "doc-long-1",
					title: "NICOT Isaiah 1-39",
					file_name: "nicot-isaiah-1-39-complete-commentary.pdf",
					file_size: 78643200,
					page_count: 1245,
					storage_key: "storage-key-long-1",
				},
			},
			mockProjects[0],
			mockProjects[1],
		],
		isLoading: false,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Cards handle long titles and descriptions with ellipsis truncation",
			},
		},
	},
};

export const MixedSizes: Story = {
	args: {
		projects: [
			{
				id: "project-tiny",
				title: "Small Document",
				description: "Tiny file for quick reference",
				project_dir: "small-doc",
				source_document: {
					id: "doc-tiny",
					title: "Small",
					file_name: "small.pdf",
					file_size: 102400,
					page_count: 5,
					storage_key: "storage-key-tiny",
				},
			},
			mockProjects[2],
			{
				id: "project-medium",
				title: "Medium Document",
				description: null,
				project_dir: "medium-doc",
				source_document: {
					id: "doc-medium",
					title: "Medium",
					file_name: "medium.pdf",
					file_size: 5242880,
					page_count: 150,
					storage_key: "storage-key-medium",
				},
			},
		],
		isLoading: false,
		onDeleteClick: fn(),
	},
	parameters: {
		docs: {
			description: {
				story: "Projects with various document sizes and page counts",
			},
		},
	},
};
