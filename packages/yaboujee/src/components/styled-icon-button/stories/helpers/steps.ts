import type {
	StorybookCanvas,
	StoryContext,
	StoryUser,
} from "@pubint/yaboujee/_stories";
import { pressTab } from "@pubint/yaboujee/_stories";
import { expect } from "@storybook/test";
import { styledIconButtonSelectors } from "./selectors";

type StoryFn = ReturnType<typeof import("@storybook/test")["fn"]>;

export const clickFirstIconButtonInWrapper = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click first icon button", async () => {
		const button = styledIconButtonSelectors.firstButtonInWrapper(canvas);
		await user.click(button);
	});
};

export const firstIconButtonInWrapperIsVisible = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("First icon button is visible", async () => {
		const button = styledIconButtonSelectors.firstButtonInWrapper(canvas);
		await expect(button).toBeVisible();
	});
};

export const onClickCallbackIsCalledOnce = async ({
	onClick,
	step,
}: {
	onClick: StoryFn;
	step: StoryContext["step"];
}) => {
	await step("Click callback is called once", async () => {
		await expect(onClick).toHaveBeenCalledTimes(1);
	});
};

export const focusFirstIconButtonInWrapper = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Focus first icon button", async () => {
		const button = styledIconButtonSelectors.firstButtonInWrapper(canvas);
		button.focus();
	});
};

export const pressEnterKey = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Press Enter key", async () => {
		await user.keyboard("{Enter}");
	});
};

export const pressSpaceKey = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Press Space key", async () => {
		await user.keyboard(" ");
	});
};

export const firstIconButtonHasRoleButton = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("First icon button has role button", async () => {
		const button = styledIconButtonSelectors.firstButtonInWrapper(canvas);
		await expect(button).toHaveAttribute("role", "button");
	});
};

export const onClickCallbackIsCalledOnceAfterKeyboard = async ({
	onClick,
	step,
}: {
	onClick: StoryFn;
	step: StoryContext["step"];
}) => {
	await step("Click callback is called once", async () => {
		await expect(onClick).toHaveBeenCalledTimes(1);
	});
};

export const disabledOuterButtonHasTabIndexMinusOne = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Outer icon button has tabIndex -1", async () => {
		const outerButton = styledIconButtonSelectors.firstButtonInWrapper(canvas);
		await expect(outerButton).toHaveAttribute("tabIndex", "-1");
	});
};

export const innerIconButtonIsDisabled = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Inner icon button is disabled", async () => {
		const innerButton = styledIconButtonSelectors.secondButtonInWrapper(canvas);
		await expect(innerButton).toBeDisabled();
	});
};

export const onClickCallbackIsNotCalled = async ({
	onClick,
	step,
}: {
	onClick: StoryFn;
	step: StoryContext["step"];
}) => {
	await step("Click callback is not called", async () => {
		await expect(onClick).not.toHaveBeenCalled();
	});
};

export const activeStateShowsInactive = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Active state shows inactive", async () => {
		const activeState = styledIconButtonSelectors.activeState(canvas);
		await expect(activeState).toHaveTextContent("inactive");
	});
};

export const clickFirstIconButtonOnCanvas = async ({
	canvas,
	user,
	step,
}: {
	canvas: StorybookCanvas;
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await step("Click first icon button", async () => {
		const button = styledIconButtonSelectors.allButtonsOnCanvas(canvas)[0];
		await user.click(button);
	});
};

export const activeStateShowsActive = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Active state shows active", async () => {
		const activeState = styledIconButtonSelectors.activeState(canvas);
		await expect(activeState).toHaveTextContent("active");
	});
};

export const focusFirstButtonInContainer1 = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("Focus first icon button in first group", async () => {
		const container = styledIconButtonSelectors.button1Container(canvas);
		const button1 = styledIconButtonSelectors.firstButtonInContainer(container);
		button1.focus();
	});
};

export const firstButtonInContainer1HasFocus = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("First icon button in first group has focus", async () => {
		const container = styledIconButtonSelectors.button1Container(canvas);
		const button1 = styledIconButtonSelectors.firstButtonInContainer(container);
		await expect(button1).toHaveFocus();
	});
};

export const tabTwiceToSecondGroupOuterButton = async ({
	user,
	step,
}: {
	user: StoryUser;
	step: StoryContext["step"];
}) => {
	await pressTab({ user, step });
	await pressTab({ user, step });
};

export const firstButtonInContainer2HasFocus = async ({
	canvas,
	step,
}: {
	canvas: StorybookCanvas;
	step: StoryContext["step"];
}) => {
	await step("First icon button in second group has focus", async () => {
		const container = styledIconButtonSelectors.button2Container(canvas);
		const button2 = styledIconButtonSelectors.firstButtonInContainer(container);
		await expect(button2).toHaveFocus();
	});
};

export const innerTooltipButtonHasAccessibleNameAndTitle = async ({
	canvas,
	expected,
	step,
}: {
	canvas: StorybookCanvas;
	expected: string;
	step: StoryContext["step"];
}) => {
	await step("Inner icon button has accessible name", async () => {
		const innerButton = styledIconButtonSelectors.allButtonsOnCanvas(canvas)[1];
		await expect(innerButton).toHaveAccessibleName(expected);
	});

	await step("Inner icon button has title attribute", async () => {
		const innerButton = styledIconButtonSelectors.allButtonsOnCanvas(canvas)[1];
		await expect(innerButton).toHaveAttribute("title", expected);
	});
};
