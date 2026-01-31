import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import { Accordion } from "@pubint/yabasic/components/ui/accordion";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Tag } from "lucide-react";
import { useState } from "react";
import { SidebarAccordionItem } from "../../sidebar-accordion-item";
import {
	defaultSidebarAccordionItemArgs,
	mockDragHandleProps,
	sampleContent,
} from "../shared";

const meta: Meta<typeof SidebarAccordionItem> = {
	title:
		"Components/DraggableSidebar/SidebarAccordionItem/tests/Visual Regression Tests",
	component: SidebarAccordionItem,
	parameters: {
		...visualRegressionTestConfig,
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const AllVariantsRender = () => {
	const [expanded, setExpanded] = useState<string[]>([
		"left-expanded",
		"right-expanded",
	]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
			<div>
				<div
					style={{
						fontSize: "12px",
						fontWeight: "bold",
						marginBottom: "8px",
					}}
				>
					Left Side - Expanded
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							value="left-expanded"
							title="Pages"
							icon={FileText}
							onPop={() => {}}
							index={0}
							side="left"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
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
					Left Side - Collapsed
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							value="left-collapsed"
							title="Pages"
							icon={FileText}
							onPop={() => {}}
							index={0}
							side="left"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
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
					Right Side - Expanded
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							value="right-expanded"
							title="Tags"
							icon={Tag}
							onPop={() => {}}
							index={0}
							side="right"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
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
					Right Side - Collapsed
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							value="right-collapsed"
							title="Tags"
							icon={Tag}
							onPop={() => {}}
							index={0}
							side="right"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
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
					Multiple Items with Borders
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							value="first"
							title="First Item (No Top Border)"
							icon={FileText}
							onPop={() => {}}
							index={0}
							side="left"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
						<SidebarAccordionItem
							value="second"
							title="Second Item (With Top Border)"
							icon={Tag}
							onPop={() => {}}
							index={1}
							side="left"
							dragHandleProps={mockDragHandleProps}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
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
					Without Drag Handle
				</div>
				<div style={{ width: "300px", border: "1px solid #ddd" }}>
					<Accordion value={expanded} onValueChange={setExpanded}>
						<SidebarAccordionItem
							{...defaultSidebarAccordionItemArgs}
							value="no-drag"
							dragHandleProps={null}
						>
							{sampleContent()}
						</SidebarAccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	);
};

/**
 * All variants and states
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2" },
	},
	render: AllVariantsRender,
};

/**
 * All variants and states in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile2" },
		theme: "dark",
	},
	render: AllVariantsRender,
};
