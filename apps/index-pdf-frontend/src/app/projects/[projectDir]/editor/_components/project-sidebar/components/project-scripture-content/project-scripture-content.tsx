"use client";

import { OklchColorPicker } from "@pubint/yabasic/components/ui/oklch-color-picker";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import {
	colorConfigAtom,
	indexEntriesAtom,
	mentionsAtom,
} from "@/app/projects/[projectDir]/editor/_atoms/editor-atoms";
import { EntryCreationModal } from "../../../entry-creation-modal";
import { EntryTree } from "../../../entry-tree";

export const ProjectScriptureContent = () => {
	const [indexEntries, setIndexEntries] = useAtom(indexEntriesAtom);
	const mentions = useAtomValue(mentionsAtom);
	const [colorConfig, setColorConfig] = useAtom(colorConfigAtom);

	const [modalOpen, setModalOpen] = useState(false);

	const scriptureEntries = useMemo(
		() => indexEntries.filter((e) => e.indexType === "scripture"),
		[indexEntries],
	);

	return (
		<>
			<div className="p-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Scripture Color
					</span>
					<OklchColorPicker
						value={colorConfig.scripture}
						onChange={(color) => {
							setColorConfig((prev) => ({
								...prev,
								scripture: color,
							}));
						}}
						label="Scripture color"
					/>
				</div>
			</div>
			<EntryTree
				entries={scriptureEntries}
				mentions={mentions}
				onCreateEntry={() => setModalOpen(true)}
			/>
			<EntryCreationModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				indexType="scripture"
				existingEntries={scriptureEntries}
				onCreate={(entry) => {
					const newEntry = {
						...entry,
						id: crypto.randomUUID(),
					};
					setIndexEntries((prev) => [...prev, newEntry]);
					return newEntry;
				}}
			/>
		</>
	);
};
