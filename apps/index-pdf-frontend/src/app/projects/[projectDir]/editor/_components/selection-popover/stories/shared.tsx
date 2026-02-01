import { useEffect, useRef, useState } from "react";
import { SelectionPopover } from "../selection-popover";

type SelectionPopoverWrapperProps = {
	selectedText: string;
	isCreating: boolean;
	onCreateMention: () => void;
	onCancel: () => void;
};

/**
 * Shared wrapper for SelectionPopover stories and tests.
 * Renders a document-like container with a highlighted selection area
 * that provides proper positioning for the popover.
 */
export const SelectionPopoverWrapper = ({
	selectedText,
	isCreating,
	onCreateMention,
	onCancel,
}: SelectionPopoverWrapperProps) => {
	const anchorRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const displayText =
		selectedText.length > 60
			? `${selectedText.substring(0, 60)}...`
			: selectedText;

	return (
		<div
			style={{
				position: "relative",
				width: "800px",
				height: "600px",
				padding: "2rem",
				background: "#f5f5f5",
				border: "1px solid #ccc",
			}}
		>
			<p style={{ marginBottom: "1rem", color: "#666" }}>
				Sample document text with some content that can be selected.
			</p>
			<div
				ref={anchorRef}
				data-testid="selection-anchor"
				style={{
					display: "inline-block",
					background: "rgba(59, 130, 246, 0.2)",
					padding: "2px 0",
					borderRadius: "2px",
				}}
			>
				{displayText}
			</div>
			<p style={{ marginTop: "1rem", color: "#666" }}>
				More document text continues here after the selection.
			</p>

			{mounted && anchorRef.current && (
				<SelectionPopover
					anchorEl={anchorRef.current}
					selectedText={selectedText}
					onCreateMention={onCreateMention}
					onCancel={onCancel}
					isCreating={isCreating}
				/>
			)}
		</div>
	);
};
