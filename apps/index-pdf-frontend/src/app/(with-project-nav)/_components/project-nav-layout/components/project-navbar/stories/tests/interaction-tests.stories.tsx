import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { ProjectNavbar } from "../../project-navbar";
import {
	clickThemeToggle,
	linkTextsExcludeEditorAndIndex,
	linkTextsExcludeEditorIndexProjects,
	logoLinkVisibleWithHomeHref,
	openUserMenuAndClickSignOut,
	projectEditorAndIndexHrefsMatchProjectDir,
	projectEditorIndexProjectsLinksAreVisible,
	projectsLinkOnlyNavHref,
} from "../helpers/steps";

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

/** On `/projects/.../editor`, Editor/Index/Projects links exist with correct `projectDir`. */
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
		await projectEditorIndexProjectsLinksAreVisible({ canvas, step });
		await projectEditorAndIndexHrefsMatchProjectDir({ canvas, step });
	},
};

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
		const user = userEvent.setup();
		await clickThemeToggle({ canvas, user, step });
	},
};

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
		const user = userEvent.setup();
		await openUserMenuAndClickSignOut({ canvas, user, step });
	},
};

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
		await logoLinkVisibleWithHomeHref({ canvas, step });
	},
};

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
		await projectsLinkOnlyNavHref({ canvas, step });
		await linkTextsExcludeEditorAndIndex({ canvas, step });
	},
};

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
		await linkTextsExcludeEditorIndexProjects({ canvas, step });
	},
};
