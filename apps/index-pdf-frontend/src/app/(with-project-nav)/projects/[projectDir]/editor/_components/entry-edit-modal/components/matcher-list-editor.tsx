"use client";

import { Badge } from "@pubint/yabasic/components/ui/badge";
import { Button } from "@pubint/yabasic/components/ui/button";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import { X } from "lucide-react";
import { useState } from "react";

type MatcherListEditorProps = {
	matchers: string[];
	onChange: (matchers: string[]) => void;
};

export const MatcherListEditor = ({
	matchers,
	onChange,
}: MatcherListEditorProps) => {
	const [inputValue, setInputValue] = useState("");

	const handleAdd = () => {
		const trimmedValue = inputValue.trim();
		if (!trimmedValue) return;

		if (matchers.includes(trimmedValue)) {
			return;
		}

		onChange([...matchers, trimmedValue]);
		setInputValue("");
	};

	const handleDelete = (matcherToDelete: string) => {
		onChange(matchers.filter((m) => m !== matcherToDelete));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAdd();
		}
	};

	return (
		<div className="space-y-3">
			<div>
				<Label htmlFor="matcher-input" className="text-sm font-medium mb-2">
					Matchers (aliases)
				</Label>
				<p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
					Alternative terms or phrases that should match this entry during
					detection.
				</p>

				{matchers.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-3">
						{matchers.map((matcher) => (
							<Badge
								key={matcher}
								variant="secondary"
								className="flex items-center gap-1 px-2 py-1"
							>
								<span className="text-sm">{matcher}</span>
								<button
									type="button"
									onClick={() => handleDelete(matcher)}
									className="ml-1 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-0.5 transition-colors"
									aria-label={`Remove matcher "${matcher}"`}
								>
									<X className="w-3 h-3" />
								</button>
							</Badge>
						))}
					</div>
				)}

				<div className="flex gap-2">
					<Input
						id="matcher-input"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Type a matcher and press Enter..."
						className="flex-1"
					/>
					<Button type="button" onClick={handleAdd} variant="outline" size="sm">
						Add
					</Button>
				</div>
			</div>
		</div>
	);
};
