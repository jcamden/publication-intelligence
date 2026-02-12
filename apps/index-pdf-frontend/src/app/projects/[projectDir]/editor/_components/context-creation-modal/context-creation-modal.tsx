"use client";

import { DEFAULT_CONTEXT_COLORS, validatePageRange } from "@pubint/core";
import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Field,
	FieldError,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Label } from "@pubint/yabasic/components/ui/label";
import {
	RadioGroup,
	RadioGroupItem,
} from "@pubint/yabasic/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@pubint/yabasic/components/ui/select";
import { Spinner } from "@pubint/yabasic/components/ui/spinner";
import { Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

type BoundingBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type ContextCreationModalProps = {
	open: boolean;
	onClose: () => void;
	projectId: string;
	currentPage: number;
	documentPageCount?: number; // For validation
	drawnBbox: BoundingBox | null; // Bbox from drawing mode (required)
	contextId?: string; // If provided, edit mode
};

export const ContextCreationModal = ({
	open,
	onClose,
	projectId,
	currentPage,
	documentPageCount,
	drawnBbox,
	contextId,
}: ContextCreationModalProps) => {
	const utils = trpc.useUtils();
	const isEditMode = !!contextId;

	// Fetch context data if editing
	const { data: existingContext } = trpc.context.list.useQuery(
		{ projectId },
		{
			enabled: isEditMode && !!projectId,
			select: (contexts) => contexts.find((c) => c.id === contextId),
		},
	);

	const createContext = trpc.context.create.useMutation({
		onSuccess: () => {
			utils.context.list.invalidate({ projectId });
			utils.context.getForPage.invalidate();
		},
	});

	const updateContext = trpc.context.update.useMutation({
		onSuccess: () => {
			utils.context.list.invalidate({ projectId });
			utils.context.getForPage.invalidate();
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			contextType: "ignore" as "ignore" | "page_number",
			pageConfigMode: "this_page" as
				| "this_page"
				| "all_pages"
				| "every_other"
				| "custom",
			pageRange: "",
			startPage: currentPage,
			endPage: undefined as number | undefined,
			exceptPages: "",
			color: DEFAULT_CONTEXT_COLORS.ignore,
		},
		onSubmit: async ({ value }) => {
			if (!drawnBbox && !isEditMode) {
				return;
			}

			// Map frontend form values to backend format
			let backendPageConfigMode: "this_page" | "all_pages" | "page_range";
			if (value.pageConfigMode === "every_other") {
				// UI mode: every_other -> backend: all_pages + everyOther=true
				backendPageConfigMode = "all_pages";
			} else if (value.pageConfigMode === "custom") {
				// UI mode: custom -> backend: page_range
				backendPageConfigMode = "page_range";
			} else {
				backendPageConfigMode = value.pageConfigMode;
			}
			const isEveryOther = value.pageConfigMode === "every_other";

			// Parse exceptPages string to array of numbers
			const exceptPagesArray = value.exceptPages?.trim()
				? value.exceptPages
						.split(",")
						.map((p) => Number.parseInt(p.trim(), 10))
						.filter((p) => !Number.isNaN(p))
				: undefined;

			if (isEditMode && contextId) {
				await updateContext.mutateAsync({
					id: contextId,
					name: value.name,
					contextType: value.contextType,
					pageConfigMode: backendPageConfigMode,
					pageNumber:
						value.pageConfigMode === "this_page" ? currentPage : undefined,
					pageRange:
						value.pageConfigMode === "custom" ? value.pageRange : undefined,
					everyOther: isEveryOther,
					startPage: isEveryOther ? value.startPage : undefined,
					endPage: isEveryOther ? value.endPage : undefined,
					exceptPages: exceptPagesArray,
					color: value.color,
				});
			} else {
				if (!drawnBbox) {
					throw new Error("Bounding box is required for creating context");
				}

				await createContext.mutateAsync({
					projectId,
					name: value.name,
					contextType: value.contextType,
					bbox: drawnBbox,
					pageConfigMode: backendPageConfigMode,
					pageNumber:
						value.pageConfigMode === "this_page" ? currentPage : undefined,
					pageRange:
						value.pageConfigMode === "custom" ? value.pageRange : undefined,
					everyOther: isEveryOther,
					startPage: isEveryOther ? value.startPage : undefined,
					endPage: isEveryOther ? value.endPage : undefined,
					exceptPages: exceptPagesArray,
					color: value.color,
				});
			}

			handleClose();
		},
	});

	// Pre-fill form when editing
	useEffect(() => {
		if (existingContext && isEditMode) {
			form.setFieldValue("name", existingContext.name);
			form.setFieldValue("contextType", existingContext.contextType);

			// Map backend pageConfigMode to frontend form values
			let formPageConfigMode:
				| "this_page"
				| "all_pages"
				| "every_other"
				| "custom";
			if (existingContext.everyOther) {
				formPageConfigMode = "every_other";
			} else if (existingContext.pageConfigMode === "page_range") {
				// Backend uses "page_range", frontend uses "custom"
				formPageConfigMode = "custom";
			} else {
				formPageConfigMode =
					existingContext.pageConfigMode as typeof formPageConfigMode;
			}

			form.setFieldValue("pageConfigMode", formPageConfigMode);
			form.setFieldValue("pageRange", existingContext.pageRange || "");
			form.setFieldValue("startPage", existingContext.startPage || currentPage);
			form.setFieldValue("endPage", existingContext.endPage);
			form.setFieldValue(
				"exceptPages",
				existingContext.exceptPages
					? existingContext.exceptPages.join(", ")
					: "",
			);
			form.setFieldValue("color", existingContext.color);
		}
	}, [existingContext, isEditMode, form, currentPage]);

	const handleClose = useCallback(() => {
		form.reset();
		onClose();
	}, [form, onClose]);

	// Update color when context type changes
	const handleContextTypeChange = (newType: "ignore" | "page_number") => {
		form.setFieldValue("contextType", newType);
		form.setFieldValue("color", DEFAULT_CONTEXT_COLORS[newType]);
	};

	const isPending = createContext.isPending || updateContext.isPending;

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={isEditMode ? "Edit Context" : "Create Context"}
			size="lg"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={isPending}>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => form.handleSubmit()}
						disabled={form.state.isSubmitting || isPending}
					>
						{isPending ? (
							<>
								<Spinner size="sm" className="mr-2" />
								{isEditMode ? "Saving..." : "Creating..."}
							</>
						) : isEditMode ? (
							"Save"
						) : (
							"Create"
						)}
					</Button>
				</>
			}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Name Field */}
				<form.Field
					name="name"
					validators={{
						onSubmit: ({ value }) => {
							if (!value || !value.trim()) {
								return "Name is required";
							}
							return undefined;
						},
					}}
				>
					{(field) => (
						<Field>
							<FieldLabel>Name</FieldLabel>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								placeholder="e.g., Header, Footer, Page Number Top-Right"
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError>{field.state.meta.errors[0]}</FieldError>
							)}
						</Field>
					)}
				</form.Field>

				{/* Context Type */}
				<form.Field name="contextType">
					{(field) => (
						<Field>
							<FieldLabel>Type</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={(value) =>
									handleContextTypeChange(value as "ignore" | "page_number")
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ignore">Ignore</SelectItem>
									<SelectItem value="page_number">Page Number</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					)}
				</form.Field>

				{/* Page Configuration */}
				<form.Field name="pageConfigMode">
					{(field) => (
						<>
							<Field>
								<FieldLabel>Apply to</FieldLabel>
								<RadioGroup
									value={field.state.value}
									onValueChange={(value) =>
										field.handleChange(value as typeof field.state.value)
									}
								>
									<Label
										htmlFor="this_page"
										className="flex items-center space-x-2 cursor-pointer py-2"
									>
										<RadioGroupItem value="this_page" id="this_page" />
										<span>This page only</span>
									</Label>
									<Label
										htmlFor="all_pages"
										className="flex items-center space-x-2 cursor-pointer py-2"
									>
										<RadioGroupItem value="all_pages" id="all_pages" />
										<span>All pages</span>
									</Label>
									<Label
										htmlFor="every_other"
										className="flex items-center space-x-2 cursor-pointer py-2"
									>
										<RadioGroupItem value="every_other" id="every_other" />
										<span>Every other page, starting on</span>
									</Label>
									<Label
										htmlFor="custom"
										className="flex items-center space-x-2 cursor-pointer py-2"
									>
										<RadioGroupItem value="custom" id="custom" />
										<span>Custom pages</span>
									</Label>
								</RadioGroup>
							</Field>

							{/* Starting Page and Ending Page Inputs for Every Other */}
							{field.state.value === "every_other" && (
								<>
									<form.Field
										name="startPage"
										validators={{
											onSubmit: ({ value }) => {
												if (!value || value < 1) {
													return "Starting page must be >= 1";
												}
												if (documentPageCount && value > documentPageCount) {
													return `Starting page cannot exceed ${documentPageCount}`;
												}
												return undefined;
											},
										}}
									>
										{(startPageField) => (
											<Field>
												<FieldLabel>Starting on page</FieldLabel>
												<Input
													type="number"
													min={1}
													max={documentPageCount}
													value={startPageField.state.value}
													onChange={(e) =>
														startPageField.handleChange(
															Number.parseInt(e.target.value, 10),
														)
													}
													onBlur={startPageField.handleBlur}
													placeholder="Starting page number"
												/>
												{startPageField.state.meta.errors.length > 0 && (
													<FieldError>
														{startPageField.state.meta.errors[0]}
													</FieldError>
												)}
											</Field>
										)}
									</form.Field>
									<form.Field
										name="endPage"
										validators={{
											onSubmit: ({ value }) => {
												// Optional field - if empty, defaults to last page of document
												if (!value) {
													return undefined;
												}
												if (value < 1) {
													return "Ending page must be >= 1";
												}
												if (documentPageCount && value > documentPageCount) {
													return `Ending page cannot exceed ${documentPageCount}`;
												}
												const startPage = form.getFieldValue("startPage");
												if (startPage && value < startPage) {
													return "Ending page must be >= starting page";
												}
												return undefined;
											},
										}}
									>
										{(endPageField) => (
											<Field>
												<FieldLabel>Ending on page (optional)</FieldLabel>
												<Input
													type="number"
													min={1}
													max={documentPageCount}
													value={endPageField.state.value || ""}
													onChange={(e) => {
														const val = e.target.value;
														endPageField.handleChange(
															val ? Number.parseInt(val, 10) : undefined,
														);
													}}
													onBlur={endPageField.handleBlur}
													placeholder="Last page (optional)"
												/>
												{endPageField.state.meta.errors.length > 0 && (
													<FieldError>
														{endPageField.state.meta.errors[0]}
													</FieldError>
												)}
											</Field>
										)}
									</form.Field>
								</>
							)}

							{/* Custom Page Range Input */}
							{field.state.value === "custom" && (
								<form.Field
									name="pageRange"
									validators={{
										onSubmit: ({ value }) => {
											if (!value || !value.trim()) {
												return "Page range is required";
											}
											const error = validatePageRange({
												rangeStr: value,
												maxPage: documentPageCount,
											});
											return error || undefined;
										},
									}}
								>
									{(rangeField) => (
										<Field>
											<FieldLabel>Pages (e.g., 1-50, 1-2,5-6,8)</FieldLabel>
											<Input
												value={rangeField.state.value}
												onChange={(e) =>
													rangeField.handleChange(e.target.value)
												}
												onBlur={rangeField.handleBlur}
												placeholder="1-50 or 1-2,5-6,8"
											/>
											{rangeField.state.meta.errors.length > 0 && (
												<FieldError>
													{rangeField.state.meta.errors[0]}
												</FieldError>
											)}
										</Field>
									)}
								</form.Field>
							)}
						</>
					)}
				</form.Field>

				{/* Except Pages Input (only for multi-page modes) */}
				<form.Field name="pageConfigMode">
					{(pageModeField) =>
						pageModeField.state.value !== "this_page" && (
							<form.Field
								name="exceptPages"
								validators={{
									onSubmit: ({ value }) => {
										if (!value || !value.trim()) {
											return undefined; // Optional field
										}
										// Validate format: comma-separated numbers
										const pages = value.split(",").map((p) => p.trim());
										for (const page of pages) {
											const pageNum = Number.parseInt(page, 10);
											if (Number.isNaN(pageNum) || pageNum < 1) {
												return "Except pages must be comma-separated numbers (e.g., 3, 5, 7)";
											}
											if (documentPageCount && pageNum > documentPageCount) {
												return `Page ${pageNum} exceeds document page count (${documentPageCount})`;
											}
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<Field>
										<FieldLabel>
											Except pages (optional, e.g., 3, 5, 7)
										</FieldLabel>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											placeholder="3, 5, 7"
										/>
										{field.state.meta.errors.length > 0 && (
											<FieldError>{field.state.meta.errors[0]}</FieldError>
										)}
									</Field>
								)}
							</form.Field>
						)
					}
				</form.Field>

				{/* Color Picker */}
				<form.Field name="color">
					{(field) => (
						<Field>
							<FieldLabel>Color</FieldLabel>
							<Input
								type="color"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className="h-10 w-20"
							/>
						</Field>
					)}
				</form.Field>
			</form>
		</Modal>
	);
};
