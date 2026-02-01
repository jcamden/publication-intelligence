import type { Meta, StoryObj } from "@storybook/react";
import { TrpcDecorator } from "../../storybook-utils/trpc-decorator";
import { UserProfile } from "../user-profile";

const meta: Meta<typeof UserProfile> = {
	title: "Components/UserProfile",
	component: UserProfile,
	decorators: [
		(Story) => (
			<TrpcDecorator>
				<Story />
			</TrpcDecorator>
		),
	],
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component:
					"User profile component displaying authenticated user information with sign out functionality",
			},
		},
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoadingState: Story = {
	parameters: {
		docs: {
			description: {
				story: "Loading state while fetching user data",
			},
		},
	},
};

export const NotAuthenticated: Story = {
	parameters: {
		docs: {
			description: {
				story: "Error state when user is not authenticated",
			},
		},
	},
};
