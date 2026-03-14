import { defaultInteractionTestMeta } from "@pubint/storybook-config";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
	resetMockScriptureConfig,
	setMockScriptureConfig,
	storybookQueryClient,
} from "@/app/_common/_test-utils/storybook-utils/trpc-decorator";
import { ScriptureSetupSection } from "../../../scripture-setup-section";

const meta: Meta<typeof ScriptureSetupSection> = {
	...defaultInteractionTestMeta,
	title:
		"Projects/[ProjectDir]/Editor/ProjectSidebar/ProjectScriptureContent/ScriptureSetupSection/tests/Interaction Tests",
	component: ScriptureSetupSection,
	parameters: {
		layout: "centered",
	},
	args: {
		projectId: "mock-project-id",
		projectIndexTypeId: "mock-pit-scripture-id",
		onBootstrapSuccess: () => {},
	},
	decorators: [
		(Story) => (
			<div className="w-80">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Bootstrap button is disabled when no canon selected.
 */
export const BootstrapButtonDisabledWhenNoCanon: Story = {
	play: async ({ canvasElement, step }) => {
		resetMockScriptureConfig();
		const canvas = within(canvasElement);

		await step("Wait for section to load", async () => {
			await waitFor(
				() => {
					expect(canvas.getByLabelText("Select canon")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Verify bootstrap button is disabled", async () => {
			const bootstrapButton = canvas.getByRole("button", {
				name: /bootstrap scripture data/i,
			});
			expect(bootstrapButton).toBeDisabled();
		});
	},
};

/**
 * Canon selection enables extra books and changes dirty state.
 */
export const CanonSelectionEnablesExtraBooks: Story = {
	play: async ({ canvasElement, step }) => {
		resetMockScriptureConfig();
		const canvas = within(canvasElement);

		await step("Wait for section to load", async () => {
			await waitFor(
				() => {
					expect(canvas.getByLabelText("Select canon")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Select Protestant canon", async () => {
			const canonTrigger = canvas.getByLabelText("Select canon");
			await userEvent.click(canonTrigger);
			const protestantOption = await within(document.body).findByRole(
				"option",
				{ name: /protestant/i },
			);
			await userEvent.click(protestantOption);
		});

		await step("Verify extra books section is visible", async () => {
			await waitFor(() => {
				expect(canvas.getByLabelText("Search extra books")).toBeInTheDocument();
			});
		});

		await step("Verify Save config button is enabled (dirty)", async () => {
			const saveButton = canvas.getByRole("button", {
				name: /save scripture config/i,
			});
			expect(saveButton).toBeEnabled();
		});
	},
};

/**
 * Corpus toggles change dirty state.
 */
export const CorpusTogglesChangeDirtyState: Story = {
	play: async ({ canvasElement, step }) => {
		resetMockScriptureConfig();
		const canvas = within(canvasElement);

		await step("Wait for section to load", async () => {
			await waitFor(
				() => {
					expect(
						canvas.getByLabelText("Include Apocrypha"),
					).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		await step("Toggle Apocrypha checkbox", async () => {
			const apocryphaCheckbox = canvas.getByLabelText("Include Apocrypha");
			await userEvent.click(apocryphaCheckbox);
			expect(apocryphaCheckbox).toBeChecked();
		});

		await step("Verify Save config button is enabled", async () => {
			const saveButton = canvas.getByRole("button", {
				name: /save scripture config/i,
			});
			expect(saveButton).toBeEnabled();
		});
	},
};

const SAVED_SCRIPTURE_CONFIG = {
	id: "mock-config-id",
	projectId: "mock-project-id",
	projectIndexTypeId: "mock-pit-scripture-id",
	selectedCanon: "protestant",
	includeApocrypha: false,
	includeJewishWritings: false,
	includeClassicalWritings: false,
	includeChristianWritings: false,
	includeDeadSeaScrolls: false,
	extraBookKeys: [] as string[],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

/**
 * Bootstrap button opens confirmation dialog.
 * Uses decorator to preset mock before component mounts and fetches.
 */
export const BootstrapButtonOpensConfirmationDialog: Story = {
	decorators: [
		(Story) => {
			setMockScriptureConfig(SAVED_SCRIPTURE_CONFIG);
			storybookQueryClient.clear();
			return <Story />;
		},
	],
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);

		await step("Wait for section to load with canon", async () => {
			await waitFor(
				() => {
					const bootstrapButton = canvas.getByRole("button", {
						name: /bootstrap scripture data/i,
					});
					expect(bootstrapButton).toBeEnabled();
				},
				{ timeout: 3000 },
			);
		});

		await step("Click Bootstrap and verify dialog opens", async () => {
			const bootstrapButton = canvas.getByRole("button", {
				name: /bootstrap scripture data/i,
			});
			await userEvent.click(bootstrapButton);
			await waitFor(() => {
				const dialog = within(document.body).getByRole("dialog", {
					name: /bootstrap scripture data/i,
				});
				expect(dialog).toBeInTheDocument();
			});
		});
	},
};
