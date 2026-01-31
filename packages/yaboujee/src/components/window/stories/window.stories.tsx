import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Window } from "../window";

const codeBlock = `import { Window } from "@pubint/yaboujee";
import { useState } from "react";

const [windows, setWindows] = useState([
  {
    id: "page-info",
    position: { x: 6.25, y: 6.25 },
    size: { width: 25, height: 18.75 },
    isMaximized: false,
  }
]);

<Window
  id="page-info"
  title="Page Information"
  zIndex={1000}
  isMaximized={false}
  sidebarCollapsed={false}
  position={{ x: 6.25, y: 6.25 }}
  size={{ width: 25, height: 18.75 }}
  side="left"
  onUnpop={() => returnToSidebar()}
  onClose={() => closeWindow()}
  onMaximize={() => toggleMaximize()}
  onPositionChange={(position) => updatePosition(position)}
  onSizeChange={(size) => updateSize(size)}
  onFocus={() => bringToFront()}
>
  <div>Window content here</div>
</Window>
`;

const additionalMarkdownDescription = `
## Use cases
Use Window for creating draggable, resizable floating windows. Perfect for popped-out sidebar panels, multi-window interfaces, or any application requiring movable content containers.

## Features
- **Draggable**: Move windows by dragging the title bar
- **Resizable**: Resize from edges and corners
- **Maximizable**: Toggle between normal and maximized states
- **Scrollable content**: Automatic scrollbar detection
- **Z-index management**: Focus handling for window layering
- **Position persistence**: Callbacks for saving window state
- **Size constraints**: Respects minimum/maximum sizes from react-rnd
- **Responsive**: Size and position in rem units (automatically converts to px)

## Window State
All dimensions use rem units (1rem = 16px):
- \`position\`: { x: number, y: number } in rem
- \`size\`: { width: number, height: number } in rem
- \`isMaximized\`: boolean

## Callbacks
- \`onPositionChange\`: Called when window is dragged
- \`onSizeChange\`: Called when window is resized
- \`onResizeStop\`: Optional callback after resize completes
- \`onFocus\`: Called when window is clicked or dragged
- \`onUnpop\`: Return window content to sidebar
- \`onClose\`: Close the window
- \`onMaximize\`: Toggle maximize state

## Sidebar Integration
- \`sidebarCollapsed\`: Controls whether close or unpop button shows
- \`side\`: Which sidebar the window came from (left/right)

## Accessibility
Full keyboard support via react-rnd, with proper focus management.
`;

const SampleContent = () => (
	<div style={{ padding: "16px" }}>
		<h4 style={{ marginBottom: "12px" }}>Window Content</h4>
		<p style={{ marginBottom: "8px" }}>
			This is sample content inside a floating window.
		</p>
		<p style={{ marginBottom: "8px" }}>
			You can add any React components here.
		</p>
		<div style={{ marginTop: "16px", padding: "12px", background: "#f3f4f6" }}>
			<strong>Info Box</strong>
			<p style={{ fontSize: "14px", marginTop: "4px" }}>
				The window is draggable and resizable.
			</p>
		</div>
	</div>
);

const LongScrollContent = () => (
	<div style={{ padding: "16px" }}>
		<h4 style={{ marginBottom: "12px" }}>Scrollable Content</h4>
		{Array.from({ length: 20 }, (_, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: static test content
			<p key={i} style={{ marginBottom: "8px" }}>
				Paragraph {i + 1}: This is sample content to demonstrate scrolling
				behavior.
			</p>
		))}
	</div>
);

const meta = {
	title: "Components/Window",
	component: Window,
	parameters: {
		docs: {
			description: {
				component: `A draggable, resizable floating window component with maximize support and scrollable content.

${additionalMarkdownDescription}

## Example Usage

\`\`\`tsx
${codeBlock}
\`\`\``,
			},
		},
		layout: "fullscreen",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Window>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default window from left sidebar
 */
export const DefaultLeftSide: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [position, setPosition] = useState({ x: 6.25, y: 6.25 });
		const [size, setSize] = useState({ width: 25, height: 18.75 });
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<Window
				id="default-window"
				title="Left Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={position}
				size={size}
				side="left"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={setPosition}
				onSizeChange={setSize}
				onFocus={() => console.log("focus")}
			>
				<SampleContent />
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Default draggable and resizable window from left sidebar.",
			},
		},
	},
};

/**
 * Window from right sidebar
 */
export const RightSide: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [position, setPosition] = useState({ x: 50, y: 6.25 });
		const [size, setSize] = useState({ width: 25, height: 18.75 });
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<Window
				id="right-window"
				title="Right Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={position}
				size={size}
				side="right"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={setPosition}
				onSizeChange={setSize}
				onFocus={() => console.log("focus")}
			>
				<SampleContent />
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Window positioned on right side (from right sidebar).",
			},
		},
	},
};

/**
 * Maximized window
 */
export const Maximized: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [isMaximized, setIsMaximized] = useState(true);

		return (
			<Window
				id="maximized-window"
				title="Maximized Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={{ x: 0, y: 0 }}
				size={{ width: 80, height: 50 }}
				side="left"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={() => {}}
				onSizeChange={() => {}}
				onFocus={() => console.log("focus")}
			>
				<SampleContent />
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Maximized window (not draggable or resizable in this state). Click minimize to restore.",
			},
		},
	},
};

/**
 * Small window
 */
export const SmallWindow: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [position, setPosition] = useState({ x: 6.25, y: 6.25 });
		const [size, setSize] = useState({ width: 18, height: 12 });
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<Window
				id="small-window"
				title="Small Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={position}
				size={size}
				side="left"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={setPosition}
				onSizeChange={setSize}
				onFocus={() => console.log("focus")}
			>
				<div style={{ padding: "16px" }}>
					<p>Compact window content</p>
				</div>
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Smaller window demonstrating minimum size constraints.",
			},
		},
	},
};

/**
 * Large window
 */
export const LargeWindow: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [position, setPosition] = useState({ x: 6.25, y: 6.25 });
		const [size, setSize] = useState({ width: 40, height: 30 });
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<Window
				id="large-window"
				title="Large Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={position}
				size={size}
				side="left"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={setPosition}
				onSizeChange={setSize}
				onFocus={() => console.log("focus")}
			>
				<SampleContent />
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Large window showing more content area.",
			},
		},
	},
};

/**
 * Window with scrollable content
 */
export const WithScrollableContent: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [position, setPosition] = useState({ x: 6.25, y: 6.25 });
		const [size, setSize] = useState({ width: 25, height: 18.75 });
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<Window
				id="scrollable-window"
				title="Scrollable Window"
				zIndex={1000}
				isMaximized={isMaximized}
				sidebarCollapsed={false}
				position={position}
				size={size}
				side="left"
				onUnpop={() => console.log("unpop")}
				onClose={() => console.log("close")}
				onMaximize={() => setIsMaximized(!isMaximized)}
				onPositionChange={setPosition}
				onSizeChange={setSize}
				onFocus={() => console.log("focus")}
			>
				<LongScrollContent />
			</Window>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Window with scrollable content demonstrating automatic scrollbar detection.",
			},
		},
	},
};

/**
 * Multiple windows with z-index
 */
export const MultipleWindows: Story = {
	// biome-ignore lint/suspicious/noExplicitAny: custom render function doesn't use args
	args: {} as any,
	render: () => {
		const [activeWindow, setActiveWindow] = useState("window-1");

		return (
			<>
				<Window
					id="window-1"
					title="Window 1"
					zIndex={activeWindow === "window-1" ? 1001 : 1000}
					isMaximized={false}
					sidebarCollapsed={false}
					position={{ x: 6.25, y: 6.25 }}
					size={{ width: 20, height: 15 }}
					side="left"
					onUnpop={() => console.log("unpop 1")}
					onClose={() => console.log("close 1")}
					onMaximize={() => {}}
					onPositionChange={() => {}}
					onSizeChange={() => {}}
					onFocus={() => setActiveWindow("window-1")}
				>
					<div style={{ padding: "16px" }}>
						<h4>Window 1</h4>
						<p>Click to bring to front</p>
					</div>
				</Window>

				<Window
					id="window-2"
					title="Window 2"
					zIndex={activeWindow === "window-2" ? 1001 : 1000}
					isMaximized={false}
					sidebarCollapsed={false}
					position={{ x: 18, y: 12.5 }}
					size={{ width: 20, height: 15 }}
					side="left"
					onUnpop={() => console.log("unpop 2")}
					onClose={() => console.log("close 2")}
					onMaximize={() => {}}
					onPositionChange={() => {}}
					onSizeChange={() => {}}
					onFocus={() => setActiveWindow("window-2")}
				>
					<div style={{ padding: "16px" }}>
						<h4>Window 2</h4>
						<p>Click to bring to front</p>
					</div>
				</Window>
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Multiple windows demonstrating z-index management and focus.",
			},
		},
	},
};
