import type { StoryStep, StoryUser } from "./types";

export const pressTab = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryStep;
}) => {
	await step("Press Tab key", async () => {
		await user.tab();
	});
};

export const waitMs = async ({ ms, step }: { ms: number; step: StoryStep }) => {
	await step(`Wait ${ms} ms`, async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
};
