"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@pubint/yabasic/components/ui/alert-dialog";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import { useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

export type DeleteAccountDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userEmail: string;
	onSuccess: () => void;
	onLogout: () => void;
};

export const DeleteAccountDialog = ({
	open,
	onOpenChange,
	userEmail,
	onSuccess,
	onLogout,
}: DeleteAccountDialogProps) => {
	const [confirmText, setConfirmText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
		onSuccess: () => {
			// Clear the auth token first
			onLogout();
			// Then call success callback (which should redirect)
			onSuccess();
		},
		onError: (err: { message: string }) => {
			setError(err.message);
		},
	});

	const handleDelete = () => {
		if (confirmText !== userEmail) {
			setError(
				"Email does not match. Please type your email exactly as shown.",
			);
			return;
		}

		setError(null);
		deleteAccountMutation.mutate();
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setConfirmText("");
			setError(null);
		}
		onOpenChange(newOpen);
	};

	const isConfirmValid = confirmText === userEmail;

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Account</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove all your data from our servers, including:
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4 py-4">
					<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
						<li>All your projects</li>
						<li>All uploaded documents</li>
						<li>All index entries and mentions</li>
						<li>Your account information</li>
					</ul>

					<div className="space-y-2">
						<Label htmlFor="confirm-email">
							Type <span className="font-mono font-bold">{userEmail}</span> to
							confirm
						</Label>
						<Input
							id="confirm-email"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder={userEmail}
							disabled={deleteAccountMutation.isPending}
						/>
					</div>

					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleteAccountMutation.isPending}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={!isConfirmValid || deleteAccountMutation.isPending}
						className="bg-destructive hover:bg-destructive/90"
					>
						{deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
