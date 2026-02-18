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
import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
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
import { useAtom } from "jotai";
import { CheckIcon, Loader2, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { useTheme } from "@/app/_common/_providers/theme-provider";
import { trpc } from "@/app/_common/_utils/trpc";
import { ProjectNavbar } from "@/app/projects/_components/project-navbar";
import { mentionCreationShowPageSublocationAtom } from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { DeleteAccountDialog } from "./_components/delete-account-dialog";

export default function SettingsPage() {
	const router = useRouter();
	const { authToken, clearToken, isLoading: isAuthLoading } = useAuthToken();
	const { theme, setTheme } = useTheme();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [selectedModel, setSelectedModel] = useState("");
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [
		showPageSublocationInMentionCreation,
		setShowPageSublocationInMentionCreation,
	] = useAtom(mentionCreationShowPageSublocationAtom);

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

	// Fetch user settings
	const userSettingsQuery = trpc.userSettings.get.useQuery(
		{},
		{
			enabled: !!authToken,
		},
	);

	// Fetch available models (only if user settings are loaded and user has an API key)
	const { data: models = [], isLoading: isLoadingModels } =
		trpc.userSettings.listModels.useQuery(
			{},
			{
				enabled: !!authToken && !!userSettingsQuery.data?.openrouterApiKey,
			},
		);

	// Default free models to show when no API key is set
	const defaultFreeModels = [
		{
			id: "meta-llama/llama-3.2-3b-instruct:free",
			name: "Meta: Llama 3.2 3B Instruct (free)",
			description: "Fast, efficient 3B parameter model from Meta",
			context_length: 131072,
			pricing: { prompt: "0", completion: "0" },
		},
		{
			id: "google/gemini-flash-1.5:free",
			name: "Google: Gemini Flash 1.5 (free)",
			description: "Fast and versatile model from Google",
			context_length: 1048576,
			pricing: { prompt: "0", completion: "0" },
		},
		{
			id: "mistralai/mistral-7b-instruct:free",
			name: "Mistral: 7B Instruct (free)",
			description: "Efficient 7B parameter model",
			context_length: 32768,
			pricing: { prompt: "0", completion: "0" },
		},
		{
			id: "openai/gpt-4o-mini",
			name: "OpenAI: GPT-4o Mini",
			description: "Cost-effective GPT-4 variant",
			context_length: 128000,
			pricing: { prompt: "0.00015", completion: "0.0006" },
		},
		{
			id: "anthropic/claude-3.5-haiku",
			name: "Anthropic: Claude 3.5 Haiku",
			description: "Fast and affordable Claude model",
			context_length: 200000,
			pricing: { prompt: "0.0008", completion: "0.004" },
		},
	];

	// Use fetched models if available, otherwise use default free models
	const availableModels =
		models.length > 0 || userSettingsQuery.data?.openrouterApiKey
			? models
			: defaultFreeModels;

	// Update user settings mutation
	const updateUserSettings = trpc.userSettings.update.useMutation({
		onSuccess: () => {
			userSettingsQuery.refetch();
			setHasUnsavedChanges(false);
		},
	});

	// Set form values when settings load
	useEffect(() => {
		if (userSettingsQuery.data) {
			setApiKey(userSettingsQuery.data.openrouterApiKey ?? "");
			setSelectedModel(userSettingsQuery.data.defaultDetectionModel ?? "");
			setHasUnsavedChanges(false);
		}
	}, [userSettingsQuery.data]);

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

	const handleSaveDetectionSettings = () => {
		updateUserSettings.mutate({
			openrouterApiKey: apiKey || undefined,
			defaultDetectionModel: selectedModel || undefined,
		});
	};

	const freeModels = availableModels.filter(
		(m) => Number.parseFloat(m.pricing.prompt) === 0,
	);
	const paidModels = availableModels.filter(
		(m) => Number.parseFloat(m.pricing.prompt) > 0,
	);

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

				{/* AI Detection Settings */}
				<Card>
					<CardHeader>
						<CardTitle>AI Detection Settings</CardTitle>
						<CardDescription>
							Configure AI-powered concept detection for your projects
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{userSettingsQuery.isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted" />
							</div>
						) : (
							<>
								<Field>
									<FieldLabel htmlFor="api-key">OpenRouter API Key</FieldLabel>
									<FieldDescription>
										Get your API key from{" "}
										<a
											href="https://openrouter.ai/keys"
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											openrouter.ai/keys
										</a>
									</FieldDescription>
									<input
										id="api-key"
										type="password"
										value={apiKey}
										onChange={(e) => {
											setApiKey(e.target.value);
											setHasUnsavedChanges(true);
										}}
										placeholder="sk-or-v1-..."
										className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="model">Default Model</FieldLabel>
									<FieldDescription>
										Choose the AI model to use for concept detection. Free
										models are recommended for testing.
										{!userSettingsQuery.data?.openrouterApiKey &&
											" Add an API key above to access more models."}
									</FieldDescription>
									{isLoadingModels ? (
										<div className="flex items-center gap-2 text-sm text-muted">
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading models...
										</div>
									) : (
										<Select
											value={selectedModel}
											onValueChange={(value) => {
												setSelectedModel(value ?? "");
												setHasUnsavedChanges(true);
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a model..." />
											</SelectTrigger>
											<SelectContent>
												{freeModels.length > 0 && (
													<>
														<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
															Free Models
														</div>
														{freeModels.map((model) => (
															<SelectItem key={model.id} value={model.id}>
																{model.name}
																{model.context_length &&
																	` (${(model.context_length / 1000).toFixed(0)}k context)`}
															</SelectItem>
														))}
													</>
												)}

												{paidModels.length > 0 && (
													<>
														<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
															Paid Models
														</div>
														{paidModels.slice(0, 20).map((model) => (
															<SelectItem key={model.id} value={model.id}>
																{model.name} ($
																{Number.parseFloat(
																	model.pricing.prompt,
																).toFixed(6)}
																/1k tokens)
															</SelectItem>
														))}
													</>
												)}
											</SelectContent>
										</Select>
									)}
								</Field>

								{hasUnsavedChanges && (
									<div className="flex justify-end gap-2 pt-2">
										<Button
											variant="outline"
											onClick={() => {
												const settings = userSettingsQuery.data;
												setApiKey(settings?.openrouterApiKey ?? "");
												setSelectedModel(settings?.defaultDetectionModel ?? "");
												setHasUnsavedChanges(false);
											}}
										>
											Cancel
										</Button>
										<Button
											onClick={handleSaveDetectionSettings}
											disabled={updateUserSettings.isPending}
										>
											{updateUserSettings.isPending && (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											)}
											Save Settings
										</Button>
									</div>
								)}
							</>
						)}
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

				{/* Editor */}
				<Card>
					<CardHeader>
						<CardTitle>Editor</CardTitle>
						<CardDescription>
							Options for the PDF editor and mention creation
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-start gap-3">
							<Checkbox
								id="show-page-sublocation"
								checked={showPageSublocationInMentionCreation}
								onCheckedChange={(checked) =>
									setShowPageSublocationInMentionCreation(!!checked)
								}
							/>
							<div className="grid gap-1.5 leading-none">
								<Label
									htmlFor="show-page-sublocation"
									className="text-sm font-medium cursor-pointer"
								>
									Show page sublocation in mention creation popover
								</Label>
								<p className="text-sm text-muted-foreground">
									When creating a mention (subject index), show the optional
									page sublocation field. You can always edit it later in the
									mention details popover.
								</p>
							</div>
						</div>
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
