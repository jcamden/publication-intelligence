import type { Meta, StoryObj } from "@storybook/react";
import EditorPage from "../page";

/**
 * Editor Page - Full page component with PDF editor
 *
 * NOTE: This page component uses Next.js routing, authentication, and tRPC.
 * For comprehensive testing of this page:
 * - Child components (Editor, ProjectNavbar) have their own Storybook tests
 * - E2E tests (Playwright) should cover full authentication flows and routing
 *
 * These stories serve as visual documentation of the page structure.
 */
const meta = {
	title: "Projects/[ProjectDir]/Editor/EditorPage",
	component: EditorPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Full editor page with authentication, project data loading, and PDF viewer. Uses project_dir for routing and supports authenticated PDF fetching.",
			},
		},
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects/sample-project/editor",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof EditorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the editor page.
 *
 * Shows the full editor layout with:
 * - Navigation bar with user info
 * - Three-section editor (project sidebar, PDF viewer, page sidebar)
 * - PDF toolbar and controls
 */
export const Default: Story = {};

/**
 * Documentation story showing the page structure.
 *
 * This page includes:
 * 1. **Authentication check** - Redirects to /login if not authenticated
 * 2. **Project data loading** - Fetches project by directory via tRPC
 * 3. **PDF loading** - Fetches authenticated PDF from source_document
 * 4. **Fallback PDF** - Uses /sample.pdf if no source_document
 *
 * Key features:
 * - Left sidebar: Project-level panels
 * - Center: PDF viewer with toolbar
 * - Right sidebar: Page-level panels
 * - State managed via Jotai atoms
 */
export const Documentation: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Full editor page structure with authentication, data fetching, and three-section layout.",
			},
		},
	},
};
