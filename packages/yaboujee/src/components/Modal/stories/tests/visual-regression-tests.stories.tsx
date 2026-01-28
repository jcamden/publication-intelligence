import {
	defaultGlobals,
	visualRegressionTestConfig,
} from "@pubint/storybook-config";
import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "../../modal";

export default {
	title: "Components/Modal/tests/Visual Regression Tests",
	component: Modal,
	tags: ["visual-regression"],
	parameters: {
		...visualRegressionTestConfig,
	},
} satisfies Meta<typeof Modal>;

export const WithLongContent: StoryObj<typeof Modal> = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const [open] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => {}}
				title="Long Content"
				footer={
					<>
						<Button variant="outline">Cancel</Button>
						<Button variant="default">Confirm</Button>
					</>
				}
			>
				<div className="space-y-4">
					{Array.from({ length: 10 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: don't care
						<p key={`paragraph-${i}`}>
							This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
							adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					))}
				</div>
			</Modal>
		);
	},
};

export const WithLongContentDark: StoryObj<typeof Modal> = {
	globals: {
		...defaultGlobals,
		theme: "dark",
	},
	render: () => {
		const [open] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => {}}
				title="Long Content"
				footer={
					<>
						<Button variant="outline">Cancel</Button>
						<Button variant="default">Confirm</Button>
					</>
				}
			>
				<div className="space-y-4">
					{Array.from({ length: 10 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: don't care
						<p key={`paragraph-${i}`}>
							This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
							adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					))}
				</div>
			</Modal>
		);
	},
};

export const WithLongContentNarrow: StoryObj<typeof Modal> = {
	globals: {
		...defaultGlobals,
		viewport: { value: "mobile1" },
	},
	render: () => {
		const [open] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => {}}
				title="Long Content"
				footer={
					<>
						<Button variant="outline">Cancel</Button>
						<Button variant="default">Confirm</Button>
					</>
				}
			>
				<div className="space-y-4">
					{Array.from({ length: 10 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: don't care
						<p key={`paragraph-${i}`}>
							This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
							adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					))}
				</div>
			</Modal>
		);
	},
};

export const WithoutCloseButton: StoryObj<typeof Modal> = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const [open] = useState(true);

		return (
			<Modal
				open={open}
				onClose={() => {}}
				title="No Close Button"
				showCloseButton={false}
			>
				<p>This modal has no close button in the header.</p>
			</Modal>
		);
	},
};

export const WithoutTitle: StoryObj<typeof Modal> = {
	globals: {
		...defaultGlobals,
	},
	render: () => {
		const [open] = useState(true);

		return (
			<Modal open={open} onClose={() => {}}>
				<div>
					<h2 className="text-2xl font-bold mb-4">Custom Header</h2>
					<p>This modal has no built-in title.</p>
				</div>
			</Modal>
		);
	},
};
