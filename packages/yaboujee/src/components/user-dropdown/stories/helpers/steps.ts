import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { storyWaitForDefaults } from "@pubint/yaboujee/_stories";
import { expect, waitFor } from "@storybook/test";
import { userDropdownSelectors } from "./selectors";

export const clickUserDropdownTrigger = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click user menu trigger", async () => {
		const trigger = userDropdownSelectors.trigger(canvas);
		await user.click(trigger);
	});
};

export const dropdownItemsAreVisible = async ({
	step,
}: {
	step: StoryContext["step"];
}) => {
	await step("Settings and Sign out items are visible", async () => {
		await waitFor(async () => {
			const settingsItem = await userDropdownSelectors.settingsItem();
			const signOutItem = await userDropdownSelectors.signOutItem();
			await expect(settingsItem).toBeInTheDocument();
			await expect(signOutItem).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};

export const userInfoIsVisible = async ({
	userName,
	userEmail,
	step,
}: {
	userName: string;
	userEmail: string;
	step: StoryContext["step"];
}) => {
	await step("User name and email are visible", async () => {
		await waitFor(async () => {
			const nameEl = await userDropdownSelectors.userName(userName);
			const emailEl = await userDropdownSelectors.userEmail(userEmail);
			await expect(nameEl).toBeInTheDocument();
			await expect(emailEl).toBeInTheDocument();
		}, storyWaitForDefaults);
	});
};
