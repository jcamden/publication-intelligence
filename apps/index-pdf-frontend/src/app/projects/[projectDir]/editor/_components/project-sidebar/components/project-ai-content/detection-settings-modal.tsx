"use client";

import { Modal } from "@pubint/yaboujee";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

export const DetectionSettingsModal = ({
	projectId,
	open,
	onClose,
}: {
	projectId: string;
	open: boolean;
	onClose: () => void;
}) => {
	const [apiKey, setApiKey] = useState("");
	const [selectedModel, setSelectedModel] = useState("");

	// Fetch current settings
	const {
		data: settings,
		isLoading: isLoadingSettings,
		refetch: refetchSettings,
	} = trpc.projectSettings.get.useQuery(
		{ projectId },
		{ enabled: open && !!projectId },
	);

	// Fetch available models
	const { data: models = [], isLoading: isLoadingModels } =
		trpc.projectSettings.listModels.useQuery(
			{ projectId },
			{ enabled: open && !!projectId },
		);

	// Update settings mutation
	const updateSettings = trpc.projectSettings.update.useMutation({
		onSuccess: () => {
			refetchSettings();
			onClose();
		},
	});

	// Set form values when settings load
	useEffect(() => {
		if (settings) {
			setApiKey(settings.openrouterApiKey || "");
			setSelectedModel(settings.defaultDetectionModel || "");
		}
	}, [settings]);

	const handleSave = () => {
		updateSettings.mutate({
			projectId,
			openrouterApiKey: apiKey || undefined,
			defaultDetectionModel: selectedModel || undefined,
		});
	};

	const freeModels = models.filter(
		(m) => Number.parseFloat(m.pricing.prompt) === 0,
	);
	const paidModels = models.filter(
		(m) => Number.parseFloat(m.pricing.prompt) > 0,
	);

	return (
		<Modal open={open} onClose={onClose} title="Detection Settings" size="xl">
			<div className="space-y-6">
				{isLoadingSettings ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted" />
					</div>
				) : (
					<>
						<div className="space-y-2">
							<label
								htmlFor="api-key"
								className="text-sm font-medium text-foreground"
							>
								OpenRouter API Key
							</label>
							<input
								id="api-key"
								type="password"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="sk-or-v1-..."
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
							/>
							<p className="text-xs text-muted">
								Get your API key from{" "}
								<a
									href="https://openrouter.ai/keys"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									openrouter.ai/keys
								</a>
							</p>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="model"
								className="text-sm font-medium text-foreground"
							>
								Default Model
							</label>
							{isLoadingModels ? (
								<div className="flex items-center gap-2 text-sm text-muted">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading models...
								</div>
							) : (
								<select
									id="model"
									value={selectedModel}
									onChange={(e) => setSelectedModel(e.target.value)}
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
								>
									<option value="">Select a model...</option>

									{freeModels.length > 0 && (
										<optgroup label="Free Models">
											{freeModels.map((model) => (
												<option key={model.id} value={model.id}>
													{model.name}
													{model.context_length &&
														` (${(model.context_length / 1000).toFixed(0)}k context)`}
												</option>
											))}
										</optgroup>
									)}

									{paidModels.length > 0 && (
										<optgroup label="Paid Models">
											{paidModels.slice(0, 20).map((model) => (
												<option key={model.id} value={model.id}>
													{model.name} ($
													{Number.parseFloat(model.pricing.prompt).toFixed(6)}
													/1k tokens)
												</option>
											))}
										</optgroup>
									)}
								</select>
							)}
							<p className="text-xs text-muted">
								Choose the AI model to use for concept detection. Free models
								are recommended for testing.
							</p>
						</div>

						<div className="flex justify-end gap-2 border-t border-border pt-4">
							<button
								type="button"
								onClick={onClose}
								className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={updateSettings.isPending}
								className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{updateSettings.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Save Settings
							</button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
};
