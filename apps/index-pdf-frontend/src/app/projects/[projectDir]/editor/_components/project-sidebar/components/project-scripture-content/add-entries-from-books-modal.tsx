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
import { Modal } from "@pubint/yaboujee";
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

export type AddEntriesFromBooksModalProps = {
	open: boolean;
	onClose: () => void;
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

export const AddEntriesFromBooksModal = ({
	open,
	onClose,
	projectId,
	projectIndexTypeId,
	onBootstrapSuccess,
}: AddEntriesFromBooksModalProps) => {
	const [formState, setFormState] = useState(DEFAULT_CONFIG);
	const [bootstrapDialogOpen, setBootstrapDialogOpen] = useState(false);
	const [extraBooksSearch, setExtraBooksSearch] = useState("");

	// Reset form when modal opens
	useEffect(() => {
		if (open) {
			setFormState(DEFAULT_CONFIG);
			setExtraBooksSearch("");
		}
	}, [open]);

	const isFormDirty = !configEquals(formState, DEFAULT_CONFIG);

	const extraBookOptions = useMemo(
		() => getExtraBookKeysOptions(formState.selectedCanon),
		[formState.selectedCanon],
	);

	const filteredExtraBookOptions = useMemo(() => {
		const q = extraBooksSearch.trim().toLowerCase();
		if (!q) return extraBookOptions;
		return extraBookOptions.filter(
			(o) =>
				o.key.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
		);
	}, [extraBookOptions, extraBooksSearch]);

	const bootstrapRun = trpc.scriptureBootstrap.run.useMutation({
		onSuccess: (counts) => {
			setBootstrapDialogOpen(false);
			toast.success(
				`Added ${counts.entriesCreated + counts.entriesReused} entries, ${counts.matchersCreated + counts.matchersReused} matchers`,
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
			onClose();
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

	const handleClear = useCallback(() => {
		setFormState(DEFAULT_CONFIG);
	}, []);

	const handleAddEntriesClick = useCallback(() => {
		logEvent({
			event: "scripture_bootstrap.triggered",
			context: {
				metadata: {
					selectedCanon: formState.selectedCanon,
					corpusCount: [
						formState.includeApocrypha,
						formState.includeJewishWritings,
						formState.includeClassicalWritings,
						formState.includeChristianWritings,
						formState.includeDeadSeaScrolls,
					].filter(Boolean).length,
					extraBookCount: formState.extraBookKeys.length,
				},
			},
		});
		setBootstrapDialogOpen(true);
	}, [formState]);

	const handleBootstrapConfirm = useCallback(() => {
		bootstrapRun.mutate({
			projectId,
			projectIndexTypeId,
			config: {
				selectedCanon: formState.selectedCanon,
				includeApocrypha: formState.includeApocrypha,
				includeJewishWritings: formState.includeJewishWritings,
				includeClassicalWritings: formState.includeClassicalWritings,
				includeChristianWritings: formState.includeChristianWritings,
				includeDeadSeaScrolls: formState.includeDeadSeaScrolls,
				extraBookKeys: formState.extraBookKeys,
			},
		});
	}, [bootstrapRun, projectId, projectIndexTypeId, formState]);

	const toggleExtraBook = useCallback((key: string) => {
		setFormState((prev) => {
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
		if (formState.includeApocrypha) items.push("apocrypha");
		if (formState.includeJewishWritings) items.push("jewishWritings");
		if (formState.includeClassicalWritings) items.push("classicalWritings");
		if (formState.includeChristianWritings) items.push("christianWritings");
		if (formState.includeDeadSeaScrolls) items.push("deadSeaScrolls");
		return items;
	}, [formState]);

	const corpusCount = [
		formState.includeApocrypha,
		formState.includeJewishWritings,
		formState.includeClassicalWritings,
		formState.includeChristianWritings,
		formState.includeDeadSeaScrolls,
	].filter(Boolean).length;
	const showLargeCorpusWarning =
		corpusCount >= 3 || formState.extraBookKeys.length > 10;

	return (
		<>
			<Modal
				open={open}
				onClose={onClose}
				title="Add Entries From Books"
				size="lg"
			>
				<div className="space-y-4">
					<Field>
						<FieldLabel id="scripture-canon-select">Canon</FieldLabel>
						<Select
							value={formState.selectedCanon ?? ""}
							onValueChange={(v) =>
								setFormState((prev) => ({
									...prev,
									selectedCanon: (v || null) as CanonId | null,
								}))
							}
							disabled={bootstrapRun.isPending}
						>
							<SelectTrigger
								id="scripture-canon-select"
								aria-label="Select canon"
								className="w-full"
							>
								<SelectValue placeholder="Select canon...">
									{formState.selectedCanon
										? CANON_LABELS[formState.selectedCanon]
										: undefined}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">(None)</SelectItem>
								{[...CANON_IDS]
									.sort((a, b) =>
										CANON_LABELS[a].localeCompare(CANON_LABELS[b]),
									)
									.map((id) => (
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
										checked={formState[key]}
										onCheckedChange={(checked) =>
											setFormState((prev) => ({
												...prev,
												[key]: checked === true,
											}))
										}
										disabled={bootstrapRun.isPending}
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
						{formState.selectedCanon ? (
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
													checked={formState.extraBookKeys.includes(key)}
													onCheckedChange={() => toggleExtraBook(key)}
													disabled={bootstrapRun.isPending}
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
							Selecting many corpora or extra books may seed hundreds of
							entries.
						</p>
					)}

					<div className="flex flex-wrap gap-2 justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={handleClear}
							disabled={!isFormDirty || bootstrapRun.isPending}
							aria-label="Clear form"
						>
							Clear
						</Button>
						<Button
							variant="default"
							size="sm"
							onClick={handleAddEntriesClick}
							disabled={!formState.selectedCanon || bootstrapRun.isPending}
							aria-label="Add entries from books"
							title={
								!formState.selectedCanon ? "Select a canon first" : undefined
							}
						>
							{bootstrapRun.isPending && !bootstrapDialogOpen ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Adding entries...
								</>
							) : (
								"Add Entries"
							)}
						</Button>
					</div>
				</div>
			</Modal>
			<BootstrapConfirmationDialog
				open={bootstrapDialogOpen}
				onClose={() => setBootstrapDialogOpen(false)}
				onConfirm={handleBootstrapConfirm}
				isPending={bootstrapRun.isPending}
				canonLabel={
					formState.selectedCanon ? CANON_LABELS[formState.selectedCanon] : null
				}
				enabledCorpora={enabledCorpora}
				extraBookCount={formState.extraBookKeys.length}
			/>
		</>
	);
};
