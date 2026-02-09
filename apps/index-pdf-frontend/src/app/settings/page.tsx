"use client";

import { Badge } from "@pubint/yabasic/components/ui/badge";
import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@pubint/yabasic/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Label } from "@pubint/yabasic/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { CheckIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { useTheme } from "@/app/_common/_providers/theme-provider";
import { trpc } from "@/app/_common/_utils/trpc";
import { ProjectNavbar } from "@/app/projects/_components/project-navbar";
import { DeleteAccountDialog } from "./_components/delete-account-dialog";

export default function SettingsPage() {
	const router = useRouter();
	const { authToken, clearToken, isLoading: isAuthLoading } = useAuthToken();
	const { theme, setTheme } = useTheme();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Auth gate: redirect to login if not authenticated
	useEffect(() => {
		// Only redirect once auth has finished loading
		if (!isAuthLoading && !authToken) {
			router.push("/login");
		}
	}, [authToken, isAuthLoading, router]);

	// Fetch current user data
	const userQuery = trpc.auth.me.useQuery(undefined, {
		enabled: !!authToken,
	});

	// Fetch user's addons
	const userAddonsQuery = trpc.projectIndexType.listUserAddons.useQuery(
		undefined,
		{
			enabled: !!authToken,
		},
	);

	// Addon mutations
	const grantAddonMutation = trpc.projectIndexType.grantAddon.useMutation({
		onSuccess: () => {
			userAddonsQuery.refetch();
		},
	});

	const revokeAddonMutation = trpc.projectIndexType.revokeAddon.useMutation({
		onSuccess: () => {
			userAddonsQuery.refetch();
		},
	});

	// Available addons (hardcoded for MVP)
	const availableAddons = [
		{
			id: "subject" as const,
			name: "Subject Index",
			description: "Topical index of key concepts, themes, and subjects",
		},
		{
			id: "author" as const,
			name: "Author Index",
			description: "Index of cited authors and their works",
		},
		{
			id: "scripture" as const,
			name: "Scripture Index",
			description: "Biblical and scriptural reference index",
		},
	];

	const enabledAddons = new Set(userAddonsQuery.data ?? []);

	const handleToggleAddon = ({
		indexType,
		isEnabled,
	}: {
		indexType: "subject" | "author" | "scripture";
		isEnabled: boolean;
	}) => {
		if (isEnabled) {
			revokeAddonMutation.mutate({ indexType });
		} else {
			grantAddonMutation.mutate({ indexType });
		}
	};

	// Show loading spinner while checking auth
	if (isAuthLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// Don't render anything if not authenticated (will redirect)
	if (!authToken) {
		return null;
	}

	const handleSignOut = () => {
		clearToken();
		router.push("/login");
	};

	return (
		<>
			<ProjectNavbar
				userName={userQuery.data?.name ?? undefined}
				userEmail={userQuery.data?.email ?? undefined}
				onSignOutClick={handleSignOut}
				showOnlyProjectsLink={true}
			/>
			<div className="container max-w-4xl mx-auto p-6 space-y-6">
				<header className="mb-8">
					<h1 className="text-3xl font-bold font-merriweather">Settings</h1>
					<p className="text-muted-foreground">
						Manage your account preferences and settings
					</p>
				</header>

				{/* Account Information */}
				<Card>
					<CardHeader>
						<CardTitle>Account Information</CardTitle>
						<CardDescription>Your account details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label className="text-sm font-medium">Email</Label>
							<p className="text-sm text-muted-foreground">
								{userQuery.data?.email || "Loading..."}
							</p>
						</div>
						{userQuery.data?.name && (
							<div>
								<Label className="text-sm font-medium">Name</Label>
								<p className="text-sm text-muted-foreground">
									{userQuery.data.name}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Index Type Addons */}
				<Card>
					<CardHeader>
						<CardTitle>Index Type Addons</CardTitle>
						<CardDescription>
							Manage which index types are available in your projects
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-3">
							{availableAddons.map((addon) => {
								const isEnabled = enabledAddons.has(addon.id);
								const isLoading =
									grantAddonMutation.isPending || revokeAddonMutation.isPending;

								return (
									<Card
										key={addon.id}
										className={`relative ${isEnabled ? "shadow-md" : ""}`}
									>
										<CardHeader>
											<div className="flex items-start justify-between mb-2">
												<Badge variant={isEnabled ? "default" : "secondary"}>
													{isEnabled ? (
														<>
															<CheckIcon className="h-3 w-3 mr-1" />
															Enabled
														</>
													) : (
														<>
															<XIcon className="h-3 w-3 mr-1" />
															Disabled
														</>
													)}
												</Badge>
											</div>
											<CardTitle className="text-base">{addon.name}</CardTitle>
											<CardDescription className="text-xs">
												{addon.description}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<Button
												size="sm"
												variant={isEnabled ? "outline" : "default"}
												onClick={() =>
													handleToggleAddon({
														indexType: addon.id,
														isEnabled,
													})
												}
												disabled={isLoading}
												className="w-full"
											>
												{isEnabled ? (
													<>
														<XIcon className="h-4 w-4 mr-2" />
														Disable
													</>
												) : (
													<>
														<PlusIcon className="h-4 w-4 mr-2" />
														Enable
													</>
												)}
											</Button>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Appearance */}
				<Card>
					<CardHeader>
						<CardTitle>Appearance</CardTitle>
						<CardDescription>Customize how the app looks</CardDescription>
					</CardHeader>
					<CardContent>
						<Field>
							<FieldLabel>Theme</FieldLabel>
							<FieldDescription>
								Choose your preferred color theme
							</FieldDescription>
							<Select
								value={theme}
								onValueChange={(value) =>
									setTheme({ theme: value as "light" | "dark" | "system" })
								}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">Light</SelectItem>
									<SelectItem value="dark">Dark</SelectItem>
									<SelectItem value="system">System</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					</CardContent>
				</Card>

				{/* Danger Zone */}
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
						<CardDescription>
							Irreversible actions that will affect your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium">Delete Account</h3>
								<p className="text-sm text-muted-foreground">
									Permanently delete your account and all associated data
								</p>
							</div>
							<Button
								variant="destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<Trash2Icon className="h-4 w-4 mr-2" />
								Delete Account
							</Button>
						</div>
					</CardContent>
				</Card>

				<DeleteAccountDialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
					userEmail={userQuery.data?.email ?? ""}
					onLogout={clearToken}
					onSuccess={() => {
						router.push("/login");
					}}
				/>
			</div>
		</>
	);
}
