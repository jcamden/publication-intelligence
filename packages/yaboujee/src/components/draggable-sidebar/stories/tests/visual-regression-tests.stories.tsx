import type { DropResult } from "@hello-pangea/dnd";
import { defaultGlobals, defaultVrtMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Tag, User } from "lucide-react";
import { useState } from "react";
import { DraggableSidebar } from "../../draggable-sidebar";

const PagesContent = () => (
	<div style={{ padding: "12px" }}>
		<p>Page 1</p>
		<p>Page 2</p>
	</div>
);
const TagsContent = () => <div style={{ padding: "12px" }}>Tags content</div>;
const AuthorContent = () => (
	<div style={{ padding: "12px" }}>Author content</div>
);

const sectionMetadata = {
	pages: { title: "Pages", icon: FileText, content: PagesContent },
	tags: { title: "Tags", icon: Tag, content: TagsContent },
	author: { title: "Author", icon: User, content: AuthorContent },
};

const meta: Meta<typeof DraggableSidebar> = {
	...defaultVrtMeta,
	title: "Components/DraggableSidebar/tests/Visual Regression Tests",
	component: DraggableSidebar,
	parameters: {
		...defaultVrtMeta.parameters,
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const AllVariantsRender = () => {
	const [leftExpanded, setLeftExpanded] = useState<string[]>(["pages"]);
	const [rightExpanded, setRightExpanded] = useState<string[]>(["tags"]);
	const [collapsedExpanded, setCollapsedExpanded] = useState<string[]>([]);
	const [allExpanded, setAllExpanded] = useState<string[]>([
		"pages",
		"tags",
		"author",
	]);

	const handleDragEnd = (_result: DropResult) => {};

	return (
		<div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
			<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
				<div>
					<div
						style={{
							fontSize: "12px",
							fontWeight: "bold",
							marginBottom: "8px",
						}}
					>
						Left Sidebar - Single Expanded
					</div>
					<div
						style={{
							height: "400px",
							width: "350px",
							border: "1px solid #ddd",
						}}
					>
						<DraggableSidebar
							visibleSections={["pages", "tags", "author"]}
							sectionMetadata={sectionMetadata}
							expandedItems={leftExpanded}
							onExpandedChange={setLeftExpanded}
							onDragEnd={handleDragEnd}
							onPop={({ id }) => console.log(id)}
							droppableId="left-sidebar"
							side="left"
						/>
					</div>
				</div>

				<div>
					<div
						style={{
							fontSize: "12px",
							fontWeight: "bold",
							marginBottom: "8px",
						}}
					>
						Right Sidebar - Single Expanded
					</div>
					<div
						style={{
							height: "400px",
							width: "350px",
							border: "1px solid #ddd",
						}}
					>
						<DraggableSidebar
							visibleSections={["pages", "tags", "author"]}
							sectionMetadata={sectionMetadata}
							expandedItems={rightExpanded}
							onExpandedChange={setRightExpanded}
							onDragEnd={handleDragEnd}
							onPop={({ id }) => console.log(id)}
							droppableId="right-sidebar"
							side="right"
						/>
					</div>
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
				<div>
					<div
						style={{
							fontSize: "12px",
							fontWeight: "bold",
							marginBottom: "8px",
						}}
					>
						All Collapsed
					</div>
					<div
						style={{
							height: "400px",
							width: "350px",
							border: "1px solid #ddd",
						}}
					>
						<DraggableSidebar
							visibleSections={["pages", "tags", "author"]}
							sectionMetadata={sectionMetadata}
							expandedItems={collapsedExpanded}
							onExpandedChange={setCollapsedExpanded}
							onDragEnd={handleDragEnd}
							onPop={({ id }) => console.log(id)}
							droppableId="collapsed-sidebar"
							side="left"
						/>
					</div>
				</div>

				<div>
					<div
						style={{
							fontSize: "12px",
							fontWeight: "bold",
							marginBottom: "8px",
						}}
					>
						All Expanded
					</div>
					<div
						style={{
							height: "400px",
							width: "350px",
							border: "1px solid #ddd",
						}}
					>
						<DraggableSidebar
							visibleSections={["pages", "tags", "author"]}
							sectionMetadata={sectionMetadata}
							expandedItems={allExpanded}
							onExpandedChange={setAllExpanded}
							onDragEnd={handleDragEnd}
							onPop={({ id }) => console.log(id)}
							droppableId="all-expanded-sidebar"
							side="left"
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

/**
 * All variants
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
	},
	render: AllVariantsRender,
};

/**
 * All variants in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "tablet" },
		theme: "dark",
	},
	render: AllVariantsRender,
};
