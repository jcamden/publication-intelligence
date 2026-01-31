import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { SelectionPopover } from "../../selection-popover";

const meta: Meta<typeof SelectionPopover> = {
	title:
		"Components/PDF/PdfEditor/SelectionPopover/tests/Visual Regression Tests",
	component: SelectionPopover,
	parameters: {
		...visualRegressionTestConfig,
		layout: "fullscreen",
	},
	tags: ["visual-regression"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const createAnchorEl = () => {
	const el = document.createElement("div");
	el.style.position = "absolute";
	el.style.top = "200px";
	el.style.left = "300px";
	el.style.width = "100px";
	el.style.height = "20px";
	return el;
};

const renderAllVariants = () => (
	<div style={{ padding: "250px 20px" }}>
		<div style={{ display: "flex", flexDirection: "column", gap: "150px" }}>
			<div>
				<div
					style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
				>
					Default State
				</div>
				<SelectionPopover
					anchorEl={createAnchorEl()}
					selectedText="The quick brown fox jumps over the lazy dog"
					onCreateMention={fn()}
					onCancel={fn()}
					isCreating={false}
				/>
			</div>

			<div>
				<div
					style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
				>
					Creating State
				</div>
				<SelectionPopover
					anchorEl={createAnchorEl()}
					selectedText="Selected text for mention"
					onCreateMention={fn()}
					onCancel={fn()}
					isCreating={true}
				/>
			</div>

			<div>
				<div
					style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}
				>
					Long Text (Truncated)
				</div>
				<SelectionPopover
					anchorEl={createAnchorEl()}
					selectedText="This is a very long text selection that will be truncated to show only the first sixty characters and then add an ellipsis at the end"
					onCreateMention={fn()}
					onCancel={fn()}
					isCreating={false}
				/>
			</div>
		</div>
	</div>
);

/**
 * All states in light mode
 */
export const AllVariants: Story = {
	globals: {
		...defaultGlobals,
	},
	render: renderAllVariants,
};

/**
 * All states in dark mode
 */
export const AllVariantsDark: Story = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: renderAllVariants,
};
