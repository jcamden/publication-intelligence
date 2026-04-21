import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { projectNavbarSelectors } from "./selectors";

export const projectEditorIndexProjectsLinksAreVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Editor, Index, and Projects links are visible", async () => {
		await expect(projectNavbarSelectors.editorLink(canvas)).toBeVisible();
		await expect(projectNavbarSelectors.indexLink(canvas)).toBeVisible();
		await expect(projectNavbarSelectors.projectsLink(canvas)).toBeVisible();
	});
};

export const projectEditorAndIndexHrefsMatchProjectDir = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Editor and Index links use project path in href", async () => {
		await expect(projectNavbarSelectors.editorLink(canvas)).toHaveAttribute(
			"href",
			"/projects/my-book/editor",
		);
		await expect(projectNavbarSelectors.indexLink(canvas)).toHaveAttribute(
			"href",
			"/projects/my-book/index",
		);
	});
};

export const clickThemeToggle = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click theme mode toggle", async () => {
		const themeToggle = projectNavbarSelectors.themeToggle(canvas);
		await expect(themeToggle).toBeVisible();
		await user.click(themeToggle);
	});
};

export const openUserMenuAndClickSignOut = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Open user menu", async () => {
		const userButton = projectNavbarSelectors.userMenuButton(canvas);
		await expect(userButton).toBeVisible();
		await user.click(userButton);
	});

	await step("Sign out menu item is visible", async () => {
		await waitFor(async () => {
			const signOutButton = projectNavbarSelectors.signOutMenuItem();
			await expect(signOutButton).toBeVisible();
		});
	});

	await step("Click Sign out", async () => {
		await user.click(projectNavbarSelectors.signOutMenuItem());
	});
};

export const logoLinkVisibleWithHomeHref = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Logo link points to home", async () => {
		const logoLink = projectNavbarSelectors.logoLink(canvas);
		await expect(logoLink).toBeVisible();
		await expect(logoLink).toHaveAttribute("href", "/");
	});
};

export const projectsLinkOnlyNavHref = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Projects link is visible with /projects href", async () => {
		const projectsLink = projectNavbarSelectors.projectsLink(canvas);
		await expect(projectsLink).toBeVisible();
		await expect(projectsLink).toHaveAttribute("href", "/projects");
	});
};

export const linkTextsExcludeEditorAndIndex = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Link texts do not include Editor or Index", async () => {
		const allLinks = projectNavbarSelectors.allLinks(canvas);
		const linkTexts = allLinks.map((link: HTMLElement) => link.textContent);
		await expect(linkTexts).not.toContain("Editor");
		await expect(linkTexts).not.toContain("Index");
	});
};

export const linkTextsExcludeEditorIndexProjects = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step(
		"Link texts do not include Editor, Index, or Projects",
		async () => {
			const allLinks = projectNavbarSelectors.allLinks(canvas);
			const linkTexts = allLinks.map((link: HTMLElement) => link.textContent);
			await expect(linkTexts).not.toContain("Editor");
			await expect(linkTexts).not.toContain("Index");
			await expect(linkTexts).not.toContain("Projects");
		},
	);
};
