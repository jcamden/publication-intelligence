"use client";

import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import { Modal } from "@pubint/yaboujee";
import { OklchColorPicker } from "@pubint/yaboujee/components/ui/oklch-color-picker/oklch-color-picker";
import { useAtom } from "jotai";
import { trpc } from "@/app/_common/_trpc/client";
import {
	colorConfigAtom,
	type IndexEntryGroupsEnabledConfig,
	indexEntryGroupsEnabledAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/highlight-atoms";
import type { IndexTypeName } from "@/app/projects/[projectDir]/editor/_types/highlight-config";

const INDEX_TYPE_LABELS: Record<IndexTypeName, string> = {
	subject: "Subject",
	author: "Author",
	scripture: "Scripture",
};

export type IndexSettingsModalProps = {
	open: boolean;
	onClose: () => void;
	indexType: IndexTypeName;
	/** Required for scripture index to show "Always display unknown entry" option */
	projectId?: string;
	projectIndexTypeId?: string;
};

export const IndexSettingsModal = ({
	open,
	onClose,
	indexType,
	projectId,
	projectIndexTypeId,
}: IndexSettingsModalProps) => {
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);
	const [groupsEnabled, setGroupsEnabled] = useAtom(
		indexEntryGroupsEnabledAtom,
	);

	const isScripture = indexType === "scripture";
	const { data: scriptureConfig } = trpc.scriptureIndexConfig.get.useQuery(
		{
			projectId: projectId ?? "",
			projectIndexTypeId: projectIndexTypeId ?? "",
		},
		{
			enabled: isScripture && !!projectId && !!projectIndexTypeId && open,
		},
	);

	const utils = trpc.useUtils();
	const upsertScriptureConfig = trpc.scriptureIndexConfig.upsert.useMutation({
		onSuccess: () => {
			utils.scriptureIndexConfig.get.invalidate({
				projectId: projectId ?? "",
				projectIndexTypeId: projectIndexTypeId ?? "",
			});
		},
	});

	const label = INDEX_TYPE_LABELS[indexType];
	const color = colorConfig[indexType];
	const groupsEnabledForType = groupsEnabled[indexType];
	const alwaysDisplayUnknownEntry =
		scriptureConfig?.alwaysDisplayUnknownEntry ?? false;

	const handleGroupsEnabledChange = (checked: boolean) => {
		setGroupsEnabled((prev: IndexEntryGroupsEnabledConfig) => ({
			...prev,
			[indexType]: checked,
		}));
	};

	const handleAlwaysDisplayUnknownChange = (checked: boolean) => {
		if (!projectId || !projectIndexTypeId) return;
		const existing = scriptureConfig;
		upsertScriptureConfig.mutate({
			projectId,
			projectIndexTypeId,
			selectedCanon: existing?.selectedCanon ?? null,
			includeApocrypha: existing?.includeApocrypha ?? false,
			includeJewishWritings: existing?.includeJewishWritings ?? false,
			includeClassicalWritings: existing?.includeClassicalWritings ?? false,
			includeChristianWritings: existing?.includeChristianWritings ?? false,
			includeDeadSeaScrolls: existing?.includeDeadSeaScrolls ?? false,
			alwaysDisplayUnknownEntry: checked,
			extraBookKeys: existing?.extraBookKeys ?? [],
		});
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={`${label} Index Settings`}
			size="md"
			showCloseButton={true}
		>
			<div className="space-y-6">
				<Field>
					<div className="flex items-center justify-between gap-3">
						<FieldLabel>{label} color</FieldLabel>
						<OklchColorPicker
							value={color}
							onChange={(newColor) => {
								setColorConfig((prev) => ({
									...prev,
									[indexType]: newColor,
								}));
							}}
							label={`${label} color`}
						/>
					</div>
				</Field>
				<Field>
					<label
						htmlFor={`index-groups-enabled-${indexType}`}
						className="flex items-center gap-2 cursor-pointer font-normal"
					>
						<Checkbox
							id={`index-groups-enabled-${indexType}`}
							checked={groupsEnabledForType}
							onCheckedChange={(checked) =>
								handleGroupsEnabledChange(checked === true)
							}
						/>
						<span>Enable index entry groups</span>
					</label>
				</Field>
				{isScripture && projectId && projectIndexTypeId && (
					<Field>
						<label
							htmlFor="always-display-unknown-entry"
							className="flex items-center gap-2 cursor-pointer font-normal"
						>
							<Checkbox
								id="always-display-unknown-entry"
								checked={alwaysDisplayUnknownEntry}
								disabled={upsertScriptureConfig.isPending}
								onCheckedChange={(checked) =>
									handleAlwaysDisplayUnknownChange(checked === true)
								}
							/>
							<span>
								Always display the &quot;Unknown&quot; entry, even without
								mentions attached
							</span>
						</label>
					</Field>
				)}
			</div>
		</Modal>
	);
};
