import { interactionTestConfig } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import type { Theme } from "../../theme-toggle";
import { ThemeToggle } from "../../theme-toggle";

export default {
	title: "Components/ThemeToggle/tests/Interaction Tests",
	component: ThemeToggle,
	tags: ["interaction-test"],
	parameters: {
		...interactionTestConfig,
	},
} satisfies Meta<typeof ThemeToggle>;

export const TogglesTheme: StoryObj<typeof ThemeToggle> = {
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");

		return (
			<div>
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				/>
				<div data-testid="current-theme" style={{ marginTop: "16px" }}>
					{theme}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const themeDisplay = canvas.getByTestId("current-theme");
		const button = canvas.getByRole("button");

		await expect(themeDisplay).toHaveTextContent("light");

		await userEvent.click(button);
		await expect(themeDisplay).toHaveTextContent("dark");

		await userEvent.click(button);
		await expect(themeDisplay).toHaveTextContent("light");
	},
};

export const DisplaysCorrectIcon: StoryObj<typeof ThemeToggle> = {
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");

		return (
			<div>
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				/>
				<div data-testid="icon-state" style={{ marginTop: "16px" }}>
					{theme === "light" ? "moon" : "sun"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const iconState = canvas.getByTestId("icon-state");
		const button = canvas.getByRole("button");

		await expect(iconState).toHaveTextContent("moon");

		await userEvent.click(button);
		await expect(iconState).toHaveTextContent("sun");
	},
};

export const HasCorrectAriaLabel: StoryObj<typeof ThemeToggle> = {
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");

		return (
			<div data-testid="aria-test">
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button");

		await expect(button).toHaveAttribute("aria-label", "Switch to dark mode");

		await userEvent.click(button);

		await expect(button).toHaveAttribute("aria-label", "Switch to light mode");
	},
};

export const AcceptsCustomClassName: StoryObj<typeof ThemeToggle> = {
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");

		return (
			<div data-testid="custom-class-container">
				<ThemeToggle
					theme={theme}
					onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
					className="custom-test-class"
				/>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole("button");

		await expect(button).toHaveClass("custom-test-class");
	},
};

export const CallsOnToggleCallback: StoryObj<typeof ThemeToggle> = {
	render: () => {
		const [theme, setTheme] = useState<Theme>("light");
		const [toggleCalled, setToggleCalled] = useState(false);

		return (
			<div>
				<ThemeToggle
					theme={theme}
					onToggle={() => {
						setTheme(theme === "light" ? "dark" : "light");
						setToggleCalled(true);
					}}
				/>
				<div data-testid="callback-status" style={{ marginTop: "16px" }}>
					{toggleCalled ? "called" : "not-called"}
				</div>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const callbackStatus = canvas.getByTestId("callback-status");
		const button = canvas.getByRole("button");

		await expect(callbackStatus).toHaveTextContent("not-called");

		await userEvent.click(button);
		await expect(callbackStatus).toHaveTextContent("called");
	},
};
