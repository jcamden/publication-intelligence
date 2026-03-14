"use client";

import type { CanonId } from "@pubint/core";
import { CANON_IDS, CANON_LABELS, getExtraBookKeysOptions } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { logEvent } from "@/app/_common/_lib/logger";
import { trpc } from "@/app/_common/_utils/trpc";
import { formatTrpcErrorMessage } from "@/app/_common/_utils/trpc-error";
import { BootstrapConfirmationDialog } from "./bootstrap-confirmation-dialog";

const DEFAULT_CONFIG = {
	selectedCanon: null as CanonId | null,
	includeApocrypha: false,
	includeJewishWritings: false,
	includeClassicalWritings: false,
	includeChristianWritings: false,
	includeDeadSeaScrolls: false,
	extraBookKeys: [] as string[],
};

export type ScriptureSetupSectionProps = {
	projectId: string;
	projectIndexTypeId: string;
	onBootstrapSuccess: () => void;
};

function configEquals(
	a: typeof DEFAULT_CONFIG,
	b: typeof DEFAULT_CONFIG,
): boolean {
	return (
		a.selectedCanon === b.selectedCanon &&
		a.includeApocrypha === b.includeApocrypha &&
		a.includeJewishWritings === b.includeJewishWritings &&
		a.includeClassicalWritings === b.includeClassicalWritings &&
		a.includeChristianWritings === b.includeChristianWritings &&
		a.includeDeadSeaScrolls === b.includeDeadSeaScrolls &&
		JSON.stringify([...a.extraBookKeys].sort()) ===
			JSON.stringify([...b.extraBookKeys].sort())
	);
}

export const ScriptureSetupSection = ({
	projectId,
	projectIndexTypeId,
	onBootstrapSuccess,
}: ScriptureSetupSectionProps) => {
	const [localConfig, setLocalConfig] = useState(DEFAULT_CONFIG);
	const [bootstrapDialogOpen, setBootstrapDialogOpen] = useState(false);
	const [extraBooksSearch, setExtraBooksSearch] = useState("");

	const { data: serverConfig, isLoading: isLoadingConfig } =
		trpc.scriptureIndexConfig.get.useQuery(
			{ projectId, projectIndexTypeId },
			{ enabled: !!projectId && !!projectIndexTypeId },
		);

	useEffect(() => {
		if (serverConfig) {
			setLocalConfig({
				selectedCanon: serverConfig.selectedCanon,
				includeApocrypha: serverConfig.includeApocrypha,
				includeJewishWritings: serverConfig.includeJewishWritings,
				includeClassicalWritings: serverConfig.includeClassicalWritings,
				includeChristianWritings: serverConfig.includeChristianWritings,
				includeDeadSeaScrolls: serverConfig.includeDeadSeaScrolls,
				extraBookKeys: serverConfig.extraBookKeys ?? [],
			});
		} else if (!isLoadingConfig && serverConfig === null) {
			setLocalConfig(DEFAULT_CONFIG);
		}
	}, [serverConfig, isLoadingConfig]);

	const serverConfigForDirty = useMemo(
		() =>
			serverConfig
				? {
						selectedCanon: serverConfig.selectedCanon,
						includeApocrypha: serverConfig.includeApocrypha,
						includeJewishWritings: serverConfig.includeJewishWritings,
						includeClassicalWritings: serverConfig.includeClassicalWritings,
						includeChristianWritings: serverConfig.includeChristianWritings,
						includeDeadSeaScrolls: serverConfig.includeDeadSeaScrolls,
						extraBookKeys: serverConfig.extraBookKeys ?? [],
					}
				: DEFAULT_CONFIG,
		[serverConfig],
	);

	const isDirty = !configEquals(localConfig, serverConfigForDirty);

	const extraBookOptions = useMemo(
		() => getExtraBookKeysOptions(localConfig.selectedCanon),
		[localConfig.selectedCanon],
	);

	const filteredExtraBookOptions = useMemo(() => {
		const q = extraBooksSearch.trim().toLowerCase();
		if (!q) return extraBookOptions;
		return extraBookOptions.filter(
			(o) =>
				o.key.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
		);
	}, [extraBookOptions, extraBooksSearch]);

	const utils = trpc.useUtils();
	const upsertConfig = trpc.scriptureIndexConfig.upsert.useMutation({
		onSuccess: () => {
			utils.scriptureIndexConfig.get.invalidate({
				projectId,
				projectIndexTypeId,
			});
			toast.success("Scripture config saved");
			logEvent({
				event: "scripture_config.saved",
				context: {
					metadata: {
						selectedCanon: localConfig.selectedCanon,
						corpusCount: [
							localConfig.includeApocrypha,
							localConfig.includeJewishWritings,
							localConfig.includeClassicalWritings,
							localConfig.includeChristianWritings,
							localConfig.includeDeadSeaScrolls,
						].filter(Boolean).length,
						extraBookCount: localConfig.extraBookKeys.length,
					},
				},
			});
		},
		onError: (error) => {
			toast.error(formatTrpcErrorMessage(error));
		},
	});

	const bootstrapRun = trpc.scriptureBootstrap.run.useMutation({
		onSuccess: (counts) => {
			setBootstrapDialogOpen(false);
			toast.success(
				`Bootstrap complete: ${counts.entriesCreated + counts.entriesReused} entries, ${counts.matchersCreated + counts.matchersReused} matchers`,
			);
			logEvent({
				event: "scripture_bootstrap.completed",
				context: {
					metadata: {
						entriesCreated: counts.entriesCreated,
						entriesReused: counts.entriesReused,
						matchersCreated: counts.matchersCreated,
						matchersReused: counts.matchersReused,
					},
				},
			});
			onBootstrapSuccess();
		},
		onError: (error) => {
			toast.error(formatTrpcErrorMessage(error));
			logEvent({
				event: "scripture_bootstrap.failed",
				context: {
					metadata: { error: error.message },
				},
			});
		},
	});

	const handleSave = useCallback(() => {
		upsertConfig.mutate({
			projectId,
			projectIndexTypeId,
			selectedCanon: localConfig.selectedCanon,
			includeApocrypha: localConfig.includeApocrypha,
			includeJewishWritings: localConfig.includeJewishWritings,
			includeClassicalWritings: localConfig.includeClassicalWritings,
			includeChristianWritings: localConfig.includeChristianWritings,
			includeDeadSeaScrolls: localConfig.includeDeadSeaScrolls,
			extraBookKeys: localConfig.extraBookKeys,
		});
	}, [projectId, projectIndexTypeId, localConfig, upsertConfig]);

	const handleBootstrapClick = useCallback(() => {
		logEvent({
			event: "scripture_bootstrap.triggered",
			context: {
				metadata: {
					selectedCanon: localConfig.selectedCanon,
					corpusCount: [
						localConfig.includeApocrypha,
						localConfig.includeJewishWritings,
						localConfig.includeClassicalWritings,
						localConfig.includeChristianWritings,
						localConfig.includeDeadSeaScrolls,
					].filter(Boolean).length,
					extraBookCount: localConfig.extraBookKeys.length,
				},
			},
		});
		setBootstrapDialogOpen(true);
	}, [localConfig]);

	const handleBootstrapConfirm = useCallback(() => {
		bootstrapRun.mutate({ projectId, projectIndexTypeId });
	}, [bootstrapRun, projectId, projectIndexTypeId]);

	const toggleExtraBook = useCallback((key: string) => {
		setLocalConfig((prev) => {
			const set = new Set(prev.extraBookKeys);
			if (set.has(key)) {
				set.delete(key);
			} else {
				set.add(key);
			}
			return { ...prev, extraBookKeys: [...set] };
		});
	}, []);

	const enabledCorpora = useMemo(() => {
		const items: string[] = [];
		if (localConfig.includeApocrypha) items.push("apocrypha");
		if (localConfig.includeJewishWritings) items.push("jewishWritings");
		if (localConfig.includeClassicalWritings) items.push("classicalWritings");
		if (localConfig.includeChristianWritings) items.push("christianWritings");
		if (localConfig.includeDeadSeaScrolls) items.push("deadSeaScrolls");
		return items;
	}, [localConfig]);

	const corpusCount = [
		localConfig.includeApocrypha,
		localConfig.includeJewishWritings,
		localConfig.includeClassicalWritings,
		localConfig.includeChristianWritings,
		localConfig.includeDeadSeaScrolls,
	].filter(Boolean).length;
	const showLargeCorpusWarning =
		corpusCount >= 3 || localConfig.extraBookKeys.length > 10;

	if (isLoadingConfig) {
		return (
			<div className="flex items-center justify-center p-4">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4 border-b border-border px-2 pb-4">
			<h3 className="text-sm font-medium text-foreground">Scripture setup</h3>

			<Field>
				<FieldLabel id="scripture-canon-select">Canon</FieldLabel>
				<Select
					value={localConfig.selectedCanon ?? ""}
					onValueChange={(v) =>
						setLocalConfig((prev) => ({
							...prev,
							selectedCanon: (v || null) as CanonId | null,
						}))
					}
					disabled={upsertConfig.isPending}
				>
					<SelectTrigger
						id="scripture-canon-select"
						aria-label="Select canon"
						className="w-full"
					>
						<SelectValue placeholder="Select canon..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">(None)</SelectItem>
						{CANON_IDS.map((id) => (
							<SelectItem key={id} value={id}>
								{CANON_LABELS[id]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<Field>
				<FieldLabel>Additional corpora</FieldLabel>
				<FieldDescription>
					Optional corpora to include alongside the selected canon.
				</FieldDescription>
				<div className="mt-2 space-y-2">
					{[
						{
							key: "includeApocrypha" as const,
							label: "Apocrypha",
						},
						{
							key: "includeJewishWritings" as const,
							label: "Jewish Writings",
						},
						{
							key: "includeClassicalWritings" as const,
							label: "Classical Writings",
						},
						{
							key: "includeChristianWritings" as const,
							label: "Christian Writings",
						},
						{
							key: "includeDeadSeaScrolls" as const,
							label: "Dead Sea Scrolls",
						},
					].map(({ key, label }) => (
						<label
							key={key}
							htmlFor={`scripture-corpus-${key}`}
							className="flex items-center gap-2 cursor-pointer font-normal text-sm"
						>
							<Checkbox
								id={`scripture-corpus-${key}`}
								checked={localConfig[key]}
								onCheckedChange={(checked) =>
									setLocalConfig((prev) => ({
										...prev,
										[key]: checked === true,
									}))
								}
								disabled={upsertConfig.isPending}
								aria-label={`Include ${label}`}
							/>
							<span>{label}</span>
						</label>
					))}
				</div>
			</Field>

			<Field>
				<FieldLabel id="scripture-extra-books">Extra books</FieldLabel>
				<FieldDescription>
					HB/NT books outside the selected canon to add.
				</FieldDescription>
				{localConfig.selectedCanon ? (
					<>
						<div className="relative mt-2">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search books..."
								value={extraBooksSearch}
								onChange={(e) => setExtraBooksSearch(e.target.value)}
								className="pl-8"
								aria-label="Search extra books"
							/>
						</div>
						<div
							className="mt-2 max-h-32 overflow-y-auto rounded-md border border-input p-2 space-y-1"
							role="listbox"
							aria-label="Extra book options"
						>
							{filteredExtraBookOptions.length === 0 ? (
								<p className="text-sm text-muted-foreground py-2">
									{extraBooksSearch.trim()
										? "No matching books"
										: "No extra books available"}
								</p>
							) : (
								filteredExtraBookOptions.map(({ key, label }) => (
									<label
										key={key}
										htmlFor={`scripture-extra-${key}`}
										className="flex items-center gap-2 cursor-pointer font-normal text-sm py-0.5"
									>
										<Checkbox
											id={`scripture-extra-${key}`}
											checked={localConfig.extraBookKeys.includes(key)}
											onCheckedChange={() => toggleExtraBook(key)}
											disabled={upsertConfig.isPending}
											aria-label={`Add ${label}`}
										/>
										<span>{label}</span>
									</label>
								))
							)}
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground mt-1">
						Select a canon first to add extra books.
					</p>
				)}
			</Field>

			{showLargeCorpusWarning && (
				<p className="text-xs text-amber-600 dark:text-amber-500">
					Selecting many corpora or extra books may seed hundreds of entries.
				</p>
			)}

			<div className="flex flex-wrap gap-2">
				<Button
					variant="default"
					size="sm"
					onClick={handleSave}
					disabled={!isDirty || upsertConfig.isPending}
					aria-label="Save scripture config"
				>
					{upsertConfig.isPending ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Saving...
						</>
					) : (
						"Save config"
					)}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleBootstrapClick}
					disabled={
						!localConfig.selectedCanon || isDirty || bootstrapRun.isPending
					}
					aria-label="Bootstrap scripture data"
					title={
						isDirty
							? "Save config first"
							: !localConfig.selectedCanon
								? "Select a canon first"
								: undefined
					}
				>
					{bootstrapRun.isPending && !bootstrapDialogOpen ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Bootstrapping...
						</>
					) : (
						"Bootstrap Scripture Data"
					)}
				</Button>
			</div>

			<BootstrapConfirmationDialog
				open={bootstrapDialogOpen}
				onClose={() => setBootstrapDialogOpen(false)}
				onConfirm={handleBootstrapConfirm}
				isPending={bootstrapRun.isPending}
				canonLabel={
					localConfig.selectedCanon
						? CANON_LABELS[localConfig.selectedCanon]
						: null
				}
				enabledCorpora={enabledCorpora}
				extraBookCount={localConfig.extraBookKeys.length}
			/>
		</div>
	);
};
