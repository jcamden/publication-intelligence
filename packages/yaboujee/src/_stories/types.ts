export type StorybookCanvas = ReturnType<
	typeof import("@storybook/test")["within"]
>;

export type StoryUser = ReturnType<
	typeof import("@storybook/test")["userEvent"]["setup"]
>;

export type StoryStep = (
	label: string,
	run: () => void | Promise<void>,
) => void | Promise<void>;

export type StoryContext = {
	body: StorybookCanvas;
	step: StoryStep;
};
