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

/**
 * Sets a controlled `<input>` value without importing `@testing-library/react`.
 * That import breaks Storybook+Vite browser tests (dynamic import of react-18 chunks).
 */
export const setControlledInputValue = (
	element: HTMLElement,
	value: string,
): void => {
	const input = element as HTMLInputElement;
	const valueSetter = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		"value",
	)?.set;
	if (valueSetter) {
		valueSetter.call(input, value);
	} else {
		input.value = value;
	}
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
};
