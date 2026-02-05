import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { ProjectNavbar } from "../../project-navbar";

const meta: Meta<typeof ProjectNavbar> = {
	...defaultInteractionTestMeta,
	title: "Projects/ProjectNavbar/tests/Interaction Tests",
	component: ProjectNavbar,
	parameters: {
		...defaultInteractionTestMeta.parameters,
		layout: "fullscreen",
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test navigation links are visible and clickable on project-specific routes
 */
export const NavigationLinksInProjectRoute: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects/my-book/editor",
			},
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify all navigation links are present", async () => {
			const editorLink = canvas.getByRole("link", { name: /editor/i });
			const indexLink = canvas.getByRole("link", { name: /^index$/i });
			const projectsLink = canvas.getByRole("link", { name: /projects/i });

			await expect(editorLink).toBeVisible();
			await expect(indexLink).toBeVisible();
			await expect(projectsLink).toBeVisible();
		});

		await step("Verify dynamic links use correct projectDir", async () => {
			const editorLink = canvas.getByRole("link", { name: /editor/i });
			const indexLink = canvas.getByRole("link", { name: /^index$/i });

			await expect(editorLink).toHaveAttribute(
				"href",
				"/projects/my-book/editor",
			);
			await expect(indexLink).toHaveAttribute(
				"href",
				"/projects/my-book/index",
			);
		});
	},
};

/**
 * Test theme toggle interaction
 */
export const ThemeToggleClick: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click theme toggle", async () => {
			const themeToggle = canvas.getByRole("button", {
				name: /switch to (dark|light) mode/i,
			});
			await expect(themeToggle).toBeVisible();
			await userEvent.click(themeToggle);
			// Button is clickable and interaction completes successfully
		});
	},
};

/**
 * Test user dropdown interactions
 */
export const UserDropdownInteraction: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Open user dropdown", async () => {
			// UserDropdown trigger has "User menu" as accessible name
			const userButton = canvas.getByRole("button", { name: /user menu/i });
			await expect(userButton).toBeVisible();
			await userEvent.click(userButton);
		});

		await step("Verify dropdown menu is open and click sign out", async () => {
			await waitFor(async () => {
				const body = within(document.body);
				const signOutButton = body.getByRole("menuitem", {
					name: /sign out/i,
				});
				await expect(signOutButton).toBeVisible();
				await userEvent.click(signOutButton);
			});
		});
	},
};

/**
 * Test logo is clickable and links to home
 */
export const LogoLink: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify logo is a link to home", async () => {
			// Logo link has "IndexPDF" as accessible name
			const logoLink = canvas.getByRole("link", { name: /indexpdf/i });
			await expect(logoLink).toBeVisible();
			await expect(logoLink).toHaveAttribute("href", "/");
		});
	},
};

/**
 * Test showOnlyProjectsLink prop - only shows Projects link
 */
export const ShowOnlyProjectsLink: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
		showOnlyProjectsLink: true,
	},
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/settings",
			},
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify only Projects link is visible", async () => {
			const projectsLink = canvas.getByRole("link", { name: /projects/i });
			await expect(projectsLink).toBeVisible();
			await expect(projectsLink).toHaveAttribute("href", "/projects");
		});

		await step("Verify Editor and Index links are NOT present", async () => {
			const allLinks = canvas.queryAllByRole("link");
			const linkTexts = allLinks.map((link) => link.textContent);

			// Should only have logo link and projects link
			await expect(linkTexts).not.toContain("Editor");
			await expect(linkTexts).not.toContain("Index");
		});
	},
};

/**
 * Test non-project routes hide navigation links
 */
export const NoNavigationLinksOnNonProjectRoutes: Story = {
	args: {
		userName: "John Doe",
		userEmail: "john@example.com",
		theme: "light",
		onThemeToggle: fn(),
		onSignOutClick: fn(),
	},
	parameters: {
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects",
			},
		},
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Verify navigation links are NOT visible", async () => {
			const allLinks = canvas.queryAllByRole("link");
			const linkTexts = allLinks.map((link) => link.textContent);

			// Should only have logo link, no navigation links
			await expect(linkTexts).not.toContain("Editor");
			await expect(linkTexts).not.toContain("Index");
			await expect(linkTexts).not.toContain("Projects");
		});
	},
};
