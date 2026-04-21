import type { StorybookCanvas } from "@pubint/yaboujee/_stories";

export const selectionPopoverSelectors = {
	cancelButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /cancel/i }),
	createMentionButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /create mention/i }),
	creatingButton: (body: StorybookCanvas) =>
		body.getByRole("button", { name: /creating/i }),
	truncatedTextPreview: (body: StorybookCanvas) =>
		body.getByText(
			/"This is a very long text selection that should be truncated \.\.\./,
		),
};
