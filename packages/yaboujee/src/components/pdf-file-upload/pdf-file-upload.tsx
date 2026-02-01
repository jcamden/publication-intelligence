"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

export type PdfFileUploadProps = {
	onFileSelect: (file: File) => void;
	onClear: () => void;
	selectedFile?: File;
	error?: string;
	disabled?: boolean;
};

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

export const PdfFileUpload = ({
	onFileSelect,
	onClear,
	selectedFile,
	error,
	disabled = false,
}: PdfFileUploadProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === "application/pdf") {
			onFileSelect(file);
		}
	};

	const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!disabled) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);

		if (disabled) return;

		const file = event.dataTransfer.files?.[0];
		if (file && file.type === "application/pdf") {
			onFileSelect(file);
		}
	};

	const handleClick = () => {
		if (!disabled) {
			inputRef.current?.click();
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
	};

	const handleClear = () => {
		if (inputRef.current) {
			inputRef.current.value = "";
		}
		onClear();
	};

	return (
		<div className="space-y-2">
			<Label>PDF Document</Label>
			{/* biome-ignore lint/a11y/useSemanticElements: Div required for drag-and-drop functionality with file input */}
			<div
				role="button"
				tabIndex={disabled ? -1 : 0}
				className={`relative rounded-lg border-2 border-dashed transition-colors ${
					isDragging
						? "border-primary bg-primary/5"
						: error
							? "border-destructive bg-destructive/5"
							: "border-input hover:border-primary/50"
				} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				<Input
					ref={inputRef}
					type="file"
					accept="application/pdf"
					onChange={handleFileChange}
					className="hidden"
					disabled={disabled}
				/>

				{selectedFile ? (
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3 flex-1 min-w-0">
							<FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{selectedFile.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(selectedFile.size)}
								</p>
							</div>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.stopPropagation();
								handleClear();
							}}
							disabled={disabled}
						>
							<XIcon className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<UploadIcon className="h-10 w-10 text-muted-foreground mb-3" />
						<p className="text-sm font-medium mb-1">
							Drop your PDF here or click to browse
						</p>
						<p className="text-xs text-muted-foreground">
							Accepts PDF files only
						</p>
					</div>
				)}
			</div>

			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
};
