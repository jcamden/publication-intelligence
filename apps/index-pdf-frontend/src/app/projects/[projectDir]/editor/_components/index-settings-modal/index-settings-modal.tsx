"use client";

import { Checkbox } from "@pubint/yabasic/components/ui/checkbox";
import { Field, FieldLabel } from "@pubint/yabasic/components/ui/field";
import { Modal } from "@pubint/yaboujee";
import { OklchColorPicker } from "@pubint/yaboujee/components/ui/oklch-color-picker/oklch-color-picker";
import { useAtom } from "jotai";
import {
	colorConfigAtom,
	type IndexEntryGroupsEnabledConfig,
	indexEntryGroupsEnabledAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
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
};

export const IndexSettingsModal = ({
	open,
	onClose,
	indexType,
}: IndexSettingsModalProps) => {
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);
	const [groupsEnabled, setGroupsEnabled] = useAtom(
		indexEntryGroupsEnabledAtom,
	);

	const label = INDEX_TYPE_LABELS[indexType];
	const color = colorConfig[indexType];
	const groupsEnabledForType = groupsEnabled[indexType];

	const handleGroupsEnabledChange = (checked: boolean) => {
		setGroupsEnabled((prev: IndexEntryGroupsEnabledConfig) => ({
			...prev,
			[indexType]: checked,
		}));
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
			</div>
		</Modal>
	);
};
