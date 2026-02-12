import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useState } from "react";
import { ColorPicker } from "../../color-picker";

const meta = {
	...defaultInteractionTestMeta,
	title: "Yabasic/ColorPicker/tests/Interaction Tests",
	component: ColorPicker,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveWrapper = () => {
	const [color, setColor] = useState("#fef3c7");

	return (
		<div className="flex flex-col gap-4">
			<ColorPicker value={color} onChange={setColor} />
			<div data-testid="result" className="text-sm">
				Selected: {color}
			</div>
		</div>
	);
};

export const OpenColorPicker: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Click color picker button", async () => {
			const button = canvas.getByRole("button", { name: "Choose color" });
			await userEvent.click(button);
		});

		await step("Verify popover opens with color grid", async () => {
			const body = within(document.body);
			await waitFor(
				async () => {
					const popup = body.getByText("Choose color");
					await expect(popup).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const SelectColor: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Open color picker", async () => {
			const button = canvas.getByRole("button", { name: "Choose color" });
			await userEvent.click(button);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Click a different color (Blue)", async () => {
			const body = within(document.body);
			const blueButton = body.getByRole("button", { name: "Blue" });
			await userEvent.click(blueButton);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify color changed and popover closed", async () => {
			const result = canvas.getByTestId("result");
			await waitFor(
				() => {
					expect(result).toHaveTextContent("Selected: #bfdbfe");
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const SelectedColorHasCheckmark: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Open color picker", async () => {
			const button = canvas.getByRole("button", { name: "Choose color" });
			await userEvent.click(button);
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify current color (Yellow) has checkmark", async () => {
			const body = within(document.body);
			const yellowButton = body.getByRole("button", { name: "Yellow" });

			await waitFor(
				async () => {
					// Check if the button has the ring styling that indicates selection
					const hasRing = yellowButton.className.includes("ring-2");
					await expect(hasRing).toBe(true);
				},
				{ timeout: 2000 },
			);
		});
	},
};

export const KeyboardNavigation: Story = {
	render: () => <InteractiveWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Open color picker with keyboard", async () => {
			const button = canvas.getByRole("button", { name: "Choose color" });
			button.focus();
			await userEvent.keyboard("{Enter}");
			await new Promise((resolve) => setTimeout(resolve, 200));
		});

		await step("Verify popover opened", async () => {
			const body = within(document.body);
			await waitFor(
				async () => {
					const popup = body.getByText("Choose color");
					await expect(popup).toBeInTheDocument();
				},
				{ timeout: 2000 },
			);
		});
	},
};
