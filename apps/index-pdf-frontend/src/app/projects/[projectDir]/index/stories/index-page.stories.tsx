import type { Meta, StoryObj } from "@storybook/react";
import IndexPage from "../page";

/**
 * Index Page - Project index page (placeholder for future index functionality)
 *
 * NOTE: This page component uses Next.js routing, authentication, and tRPC.
 * For comprehensive testing of this page:
 * - Child components (ProjectNavbar) have their own Storybook tests
 * - E2E tests (Playwright) should cover full authentication flows and routing
 *
 * These stories serve as visual documentation of the page structure.
 */
const meta = {
	title: "Projects/[ProjectDir]/Index/IndexPage",
	component: IndexPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Index page for viewing and managing project indices. Currently a placeholder with navigation.",
			},
		},
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects/sample-project/index",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof IndexPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the index page.
 *
 * Shows:
 * - Navigation bar with user info
 * - Placeholder content area
 */
export const Default: Story = {};

/**
 * Documentation story showing the page structure.
 *
 * This page includes:
 * 1. **Authentication check** - Redirects to /login if not authenticated
 * 2. **User data loading** - Fetches current user via tRPC
 * 3. **Navigation** - Shows ProjectNavbar with user info
 *
 * TODO: Add actual index functionality
 */
export const Documentation: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Placeholder page for project index functionality. Currently shows navigation and basic layout.",
			},
		},
	},
};
