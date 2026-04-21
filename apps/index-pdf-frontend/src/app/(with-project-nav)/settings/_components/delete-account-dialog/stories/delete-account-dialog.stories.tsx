import { Button } from "@pubint/yabasic/components/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { DeleteAccountDialog } from "../delete-account-dialog";

const meta = {
	title: "Settings/DeleteAccountDialog",
	component: DeleteAccountDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DeleteAccountDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<>
				<Button variant="destructive" onClick={() => setOpen(true)}>
					Delete Account
				</Button>
				<DeleteAccountDialog
					open={open}
					onOpenChange={setOpen}
					userEmail="user@example.com"
					onSuccess={() => {
						console.log("Account deleted successfully");
						setOpen(false);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
			</>
		);
	},
};

export const InitiallyOpen: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		userEmail: "user@example.com",
		onSuccess: fn(),
		onLogout: fn(),
	},
};

export const WithWarningMessage: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		userEmail: "john.doe@example.com",
		onSuccess: fn(),
		onLogout: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Dialog displays a clear warning about permanent account deletion and data loss",
			},
		},
	},
};

export const LoadingState: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(true);
		const [isDeleting, setIsDeleting] = useState(false);

		return (
			<>
				<DeleteAccountDialog
					open={open}
					onOpenChange={(isOpen) => {
						if (!isDeleting) {
							setOpen(isOpen);
						}
					}}
					userEmail="user@example.com"
					onSuccess={() => {
						console.log("Account deleted successfully");
						setIsDeleting(false);
						setOpen(false);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
				{!open && (
					<Button variant="destructive" onClick={() => setOpen(true)}>
						Delete Account
					</Button>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Type the email and click Delete to see the loading state on the action button",
			},
		},
	},
};

export const CancelAction: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(true);
		const [wasCancelled, setWasCancelled] = useState(false);

		return (
			<>
				<DeleteAccountDialog
					open={open}
					onOpenChange={(isOpen) => {
						setOpen(isOpen);
						if (!isOpen) {
							setWasCancelled(true);
							setTimeout(() => setWasCancelled(false), 2000);
						}
					}}
					userEmail="user@example.com"
					onSuccess={() => {
						console.log("Account deleted successfully");
						setOpen(false);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
				{!open && (
					<div className="space-y-4">
						{wasCancelled && (
							<div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
								Account deletion was cancelled
							</div>
						)}
						<Button variant="destructive" onClick={() => setOpen(true)}>
							Delete Account
						</Button>
					</div>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Click Cancel or close the dialog to cancel the account deletion",
			},
		},
	},
};

export const SuccessFlow: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(false);
		const [successMessage, setSuccessMessage] = useState("");

		return (
			<>
				<div className="space-y-4">
					<Button variant="destructive" onClick={() => setOpen(true)}>
						Delete Account
					</Button>
					{successMessage && (
						<div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
							{successMessage}
						</div>
					)}
				</div>
				<DeleteAccountDialog
					open={open}
					onOpenChange={setOpen}
					userEmail="user@example.com"
					onSuccess={() => {
						setSuccessMessage(
							"Account deleted successfully. You will be logged out shortly.",
						);
						setTimeout(() => setSuccessMessage(""), 5000);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Complete success flow: open dialog → type email to confirm → click delete → see success message",
			},
		},
	},
};

export const DangerousAction: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
		userEmail: "user@example.com",
		onSuccess: fn(),
		onLogout: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Destructive action dialog with clear warning. This action permanently deletes the user's account, all projects, documents, and index entries. This cannot be undone.",
			},
		},
	},
};

export const KeyboardNavigation: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<>
				<DeleteAccountDialog
					open={open}
					onOpenChange={setOpen}
					userEmail="user@example.com"
					onSuccess={() => {
						console.log("Account deleted successfully");
						setOpen(false);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
				{!open && (
					<div className="space-y-4">
						<Button variant="destructive" onClick={() => setOpen(true)}>
							Delete Account
						</Button>
						<p className="text-sm text-muted-foreground">
							Try keyboard navigation: Tab to move between buttons, Enter to
							select, ESC to cancel
						</p>
					</div>
				)}
			</>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Dialog supports full keyboard navigation and ESC to cancel",
			},
		},
	},
};

export const InSettingsPage: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<div className="max-w-2xl space-y-8">
				<div>
					<h2 className="text-2xl font-bold mb-2">Account Settings</h2>
					<p className="text-muted-foreground">
						Manage your account preferences and data
					</p>
				</div>

				<div className="space-y-6">
					<div className="border rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-2">Profile Information</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Update your account details
						</p>
						<Button variant="outline">Edit Profile</Button>
					</div>

					<div className="border rounded-lg p-6 border-destructive/50 bg-destructive/5">
						<h3 className="text-lg font-semibold text-destructive mb-2">
							Danger Zone
						</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Permanently delete your account and all associated data. This
							action cannot be undone.
						</p>
						<Button variant="destructive" onClick={() => setOpen(true)}>
							Delete Account
						</Button>
					</div>
				</div>

				<DeleteAccountDialog
					open={open}
					onOpenChange={setOpen}
					userEmail="john.doe@example.com"
					onSuccess={() => {
						console.log("Account deleted - user will be logged out");
						setOpen(false);
					}}
					onLogout={() => {
						console.log("User logged out");
					}}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Example of how the delete account dialog appears in a settings page context",
			},
		},
	},
};

export const WithConfirmationRequired: StoryObj<typeof DeleteAccountDialog> = {
	render: () => {
		const [open, setOpen] = useState(true);

		return (
			<DeleteAccountDialog
				open={open}
				onOpenChange={setOpen}
				userEmail="user@example.com"
				onSuccess={() => {
					console.log("Account deletion confirmed and executed");
					setOpen(false);
				}}
				onLogout={() => {
					console.log("User logged out");
				}}
			/>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					"Two-step confirmation process: user must type their email address exactly to confirm they understand the consequences before the Delete button becomes enabled",
			},
		},
	},
};
