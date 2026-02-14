"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
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
import { Textarea } from "@pubint/yabasic/components/ui/textarea";
import { PdfFileUpload, PdfThumbnail } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { API_URL } from "@/app/_common/_config/api";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { useDebouncedValue } from "@/app/_common/_hooks/use-debounced-value";
import { trpc } from "@/app/_common/_utils/trpc";
import { useAuthenticatedPdf } from "@/app/projects/_hooks/use-authenticated-pdf";

// All index types (for MVP)
const ALL_INDEX_TYPES = [
	{
		id: "subject" as const,
		displayName: "Subject Index",
		description: "Topical index of key concepts, themes, and subjects",
		defaultHue: 230, // Blue
		availableByDefault: true, // All users have access
	},
	{
		id: "author" as const,
		displayName: "Author Index",
		description: "Index of cited authors and their works",
		defaultHue: 270, // Purple
		availableByDefault: false,
	},
	{
		id: "scripture" as const,
		displayName: "Scripture Index",
		description: "Biblical and scriptural reference index",
		defaultHue: 160, // Green
		availableByDefault: false,
	},
] as const;

const projectFormSchema = z.object({
	title: z
		.string()
		.min(1, "Title is required")
		.max(500, "Must be 500 characters or less"),
	description: z
		.string()
		.max(2000, "Must be 2000 characters or less")
		.optional(),
	project_dir: z
		.string()
		.min(1, "Project directory is required")
		.max(100, "Must be 100 characters or less")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Must contain only lowercase letters, numbers, and hyphens (e.g., my-project)",
		),
});

const toKebabCase = (str: string): string => {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
};

export type ProjectFormProps = {
	mode?: "create" | "edit";
	projectId?: string;
	initialData?: {
		title: string;
		description: string | null;
		project_dir: string;
		selectedIndexTypes: string[];
		sourceDocument?: {
			id: string;
			title: string;
			file_name: string;
			file_size: number | null;
			page_count: number | null;
		} | null;
	};
	onSuccess: () => void;
	onCancel: () => void;
	existingProjects: Array<{ project_dir: string; title: string }>;
	renderDeleteButton?: () => React.ReactNode;
};

export const ProjectForm = ({
	mode: propMode,
	projectId,
	initialData,
	onSuccess,
	onCancel,
	existingProjects,
	renderDeleteButton,
}: ProjectFormProps) => {
	const mode = propMode ?? "create";
	const isEditMode = mode === "edit";

	const { authToken } = useAuthToken();
	const [selectedFile, setSelectedFile] = useState<File | undefined>();
	const [pdfPageCount, setPdfPageCount] = useState<number | undefined>();
	const [isProjectDirManual, setIsProjectDirManual] = useState(
		isEditMode || false,
	);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [selectedIndexTypes, setSelectedIndexTypes] = useState<string[]>(
		initialData?.selectedIndexTypes ?? ["subject"],
	);
	const [currentTitle, setCurrentTitle] = useState(initialData?.title ?? "");
	const debouncedTitle = useDebouncedValue({
		value: currentTitle,
		delay: 150,
	});

	// For edit mode: Load PDF for thumbnail display
	const editModePdfUrl =
		isEditMode && initialData?.sourceDocument
			? `${API_URL}/source-documents/${initialData.sourceDocument.id}/file`
			: null;

	const {
		blobUrl: editModePdfBlobUrl,
		isLoading: isLoadingPdf,
		error: pdfLoadError,
	} = useAuthenticatedPdf({ url: editModePdfUrl });

	// Query user's actual addons from backend
	const userAddonsQuery = trpc.projectIndexType.listUserAddons.useQuery();
	const userAddons = new Set(
		Array.isArray(userAddonsQuery.data) ? userAddonsQuery.data : [],
	);

	const createProjectMutation = trpc.project.create.useMutation();
	const updateProjectMutation = trpc.project.update.useMutation();
	const enableIndexTypeMutation = trpc.projectIndexType.enable.useMutation();

	const form = useForm({
		defaultValues: {
			title: initialData?.title ?? "",
			description: initialData?.description ?? "",
			project_dir: initialData?.project_dir ?? "",
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);

			if (isEditMode) {
				// Edit mode: Update existing project
				if (!projectId) {
					setSubmitError("Project ID is required for editing");
					return;
				}

				try {
					// Update project metadata
					await updateProjectMutation.mutateAsync({
						id: projectId,
						data: {
							title: value.title,
							description: value.description || null,
							project_dir: value.project_dir,
						} as {
							title?: string;
							description?: string | null;
							project_dir?: string;
						},
					});

					// TODO: Handle index type changes if needed
					// Compare selectedIndexTypes with initialData?.selectedIndexTypes
					// Call enable/disable endpoints for changes

					onSuccess();
				} catch (error) {
					console.error("Error updating project:", error);
					setSubmitError(
						error instanceof Error ? error.message : "Failed to update project",
					);
				}
			} else {
				// Create mode: Original create logic
				if (!selectedFile) {
					setSubmitError("Please select a PDF file");
					return;
				}

				// Validate project_dir before submission (even if auto-populated)
				const projectDirValidation =
					projectFormSchema.shape.project_dir.safeParse(value.project_dir);
				if (!projectDirValidation.success) {
					setSubmitError(
						projectDirValidation.error.issues[0]?.message ||
							"Invalid project directory",
					);
					return;
				}

				// Check for duplicate project_dir
				const isDuplicateDir = existingProjects.some(
					(p) => p.project_dir === value.project_dir,
				);
				if (isDuplicateDir) {
					setSubmitError(
						"This project directory is already in use. Please choose a different one.",
					);
					return;
				}

				// Check for duplicate title
				const isDuplicateTitle = existingProjects.some(
					(p) => p.title && p.title.toLowerCase() === value.title.toLowerCase(),
				);
				if (isDuplicateTitle) {
					setSubmitError(
						"A project with this title already exists. Please choose a different title.",
					);
					return;
				}

				try {
					// 1. Create the project
					const project = await createProjectMutation.mutateAsync({
						title: value.title,
						description: value.description,
						project_dir: value.project_dir,
					});

					if (!authToken) {
						throw new Error("Not authenticated");
					}

					// 2. Enable selected index types for the project
					const indexTypePromises = selectedIndexTypes.map((indexType) => {
						const config = ALL_INDEX_TYPES.find((t) => t.id === indexType);
						if (!config) return Promise.resolve();

						return enableIndexTypeMutation.mutateAsync({
							projectId: project.id,
							highlightType:
								indexType as (typeof ALL_INDEX_TYPES)[number]["id"],
							colorHue: config.defaultHue,
						});
					});

					// Also enable region types with default hues
					const regionTypePromises = [
						enableIndexTypeMutation.mutateAsync({
							projectId: project.id,
							highlightType: "exclude",
							colorHue: 0, // Red
						}),
						enableIndexTypeMutation.mutateAsync({
							projectId: project.id,
							highlightType: "page_number",
							colorHue: 270, // Purple
						}),
					];

					await Promise.all([...indexTypePromises, ...regionTypePromises]);

					// 3. Upload the PDF document
					const formData = new FormData();
					formData.append("file", selectedFile);
					formData.append("title", selectedFile.name);
					if (pdfPageCount !== undefined) {
						formData.append("pageCount", pdfPageCount.toString());
					}

					const response = await fetch(
						`${API_URL}/projects/${project.id}/source-documents/upload`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${authToken}`,
							},
							body: formData,
						},
					);

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || "Failed to upload document");
					}

					form.reset();
					setSelectedIndexTypes(["subject"]); // Reset to default
					onSuccess();
				} catch (error) {
					console.error("Error creating project:", error);
					setSubmitError(
						error instanceof Error ? error.message : "Failed to create project",
					);
				}
			}
		},
	});

	// Auto-populate project_dir from title (debounced to avoid performance issues)
	useEffect(() => {
		if (!isProjectDirManual && debouncedTitle) {
			const kebabTitle = toKebabCase(debouncedTitle);
			const currentProjectDir = form.getFieldValue("project_dir");
			if (currentProjectDir !== kebabTitle) {
				form.setFieldValue("project_dir", kebabTitle);
			}
		}
	}, [debouncedTitle, isProjectDirManual, form]);

	const handleFileSelect = (file: File) => {
		setSelectedFile(file);
		setSubmitError(null);
	};

	const handleFileClear = () => {
		setSelectedFile(undefined);
		setPdfPageCount(undefined);
	};

	const isSubmitting = createProjectMutation.isPending;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="grid grid-cols-[300px_1fr] gap-8">
				{/* Left Column - PDF Preview */}
				<div className="space-y-4 flex flex-col justify-between">
					<div>
						{!isEditMode ? (
							<>
								<div>
									<PdfFileUpload
										onFileSelect={handleFileSelect}
										onClear={handleFileClear}
										selectedFile={selectedFile}
										disabled={isSubmitting}
									/>
								</div>

								{selectedFile && (
									<div>
										<FieldLabel>Preview</FieldLabel>
										<div className="mt-2 w-full">
											<PdfThumbnail
												source={selectedFile}
												alt="PDF preview"
												onLoadPdf={({ numPages }) => setPdfPageCount(numPages)}
											/>
										</div>
									</div>
								)}
							</>
						) : (
							<div>
								<FieldLabel>Source Document</FieldLabel>
								<div className="mt-2 w-full h-[400px] bg-muted overflow-hidden flex-shrink-0 rounded">
									{isLoadingPdf ? (
										<div className="flex items-center justify-center h-full">
											<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
										</div>
									) : pdfLoadError ? (
										<div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
											<FileIcon className="h-12 w-12 mb-2" />
											<div className="text-sm">Failed to load PDF</div>
											<div className="text-xs mt-1">{pdfLoadError}</div>
										</div>
									) : editModePdfBlobUrl ? (
										<PdfThumbnail
											source={editModePdfBlobUrl}
											alt={
												initialData?.sourceDocument?.file_name ?? "PDF preview"
											}
										/>
									) : (
										<div className="flex items-center justify-center h-full text-muted-foreground">
											<FileIcon className="h-12 w-12" />
											<div className="text-xs mt-2">No PDF data</div>
										</div>
									)}
								</div>
								{initialData?.sourceDocument && (
									<div className="mt-2 space-y-1">
										<div className="text-sm font-medium">
											{initialData.sourceDocument.file_name}
										</div>
										{initialData.sourceDocument.page_count && (
											<div className="text-xs text-muted-foreground">
												{initialData.sourceDocument.page_count} pages
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Delete button in edit mode */}
					{renderDeleteButton && <div>{renderDeleteButton()}</div>}
				</div>

				{/* Right Column - Form Fields */}
				<div className="flex flex-col justify-between">
					<div className="space-y-6">
						<form.Field
							name="title"
							validators={{
								onChange: ({ value }) => {
									// Only basic length validation on change
									if (value && value.length > 500) {
										return "Must be 500 characters or less";
									}
									return undefined;
								},
								onBlur: ({ value }) => {
									// Full validation on blur (including expensive duplicate check)
									const result = projectFormSchema.shape.title.safeParse(value);
									if (!result.success) {
										return result.error.issues[0]?.message;
									}

									// Check for duplicate title (excluding current project in edit mode)
									if (value) {
										const isDuplicate = existingProjects.some(
											(p) =>
												p.title &&
												p.title.toLowerCase() === value.toLowerCase() &&
												(!isEditMode || p.title !== initialData?.title),
										);
										if (isDuplicate) {
											return "A project with this title already exists. Please choose a different title.";
										}
									}

									return undefined;
								},
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor="title">Project Title</FieldLabel>
									<FieldDescription>
										Give your project a descriptive name
									</FieldDescription>
									<Input
										id="title"
										value={field.state.value}
										onChange={(e) => {
											const newValue = e.target.value;
											field.handleChange(newValue);
											setCurrentTitle(newValue);
										}}
										onBlur={field.handleBlur}
										placeholder="e.g., Word Biblical Commentary: Daniel"
										disabled={isSubmitting}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError
										errors={field.state.meta.errors.map((err) => ({
											message: err,
										}))}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="description"
							validators={{
								onChange: ({ value }) => {
									if (!value) return undefined;
									const result =
										projectFormSchema.shape.description.safeParse(value);
									return result.success
										? undefined
										: result.error.issues[0]?.message;
								},
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor="description">
										Description (Optional)
									</FieldLabel>
									<FieldDescription>
										Add additional context about this project
									</FieldDescription>
									<Textarea
										id="description"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="e.g., Indexing key concepts and biblical references..."
										rows={3}
										disabled={isSubmitting}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError
										errors={field.state.meta.errors.map((err) => ({
											message: err,
										}))}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field
							name="project_dir"
							validators={{
								onChange: ({ value }) => {
									// Only basic validation on change
									if (value && value.length > 100) {
										return "Must be 100 characters or less";
									}
									if (value && !/^[a-z0-9-]*$/.test(value)) {
										return "Must contain only lowercase letters, numbers, and hyphens";
									}
									return undefined;
								},
								onBlur: ({ value }) => {
									// Full validation on blur (including expensive duplicate check)
									const result =
										projectFormSchema.shape.project_dir.safeParse(value);
									if (!result.success) {
										return result.error.issues[0]?.message;
									}

									// Check for duplicate project_dir (excluding current project in edit mode)
									if (value) {
										const isDuplicate = existingProjects.some(
											(p) =>
												p.project_dir === value &&
												(!isEditMode ||
													p.project_dir !== initialData?.project_dir),
										);
										if (isDuplicate) {
											return "This project directory is already in use. Please choose a different one.";
										}
									}

									return undefined;
								},
							}}
						>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor="project_dir">
										Project Directory
									</FieldLabel>
									<FieldDescription>
										{isEditMode
											? "Changing this will update the project URL"
											: `URL-friendly name: indexpdf.com/projects/${field.state.value || "your-project"}`}
									</FieldDescription>
									<Input
										id="project_dir"
										value={field.state.value}
										onChange={(e) => {
											field.handleChange(e.target.value);
											setIsProjectDirManual(true);
										}}
										onBlur={field.handleBlur}
										placeholder="e.g., wbc-daniel"
										disabled={isSubmitting}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError
										errors={field.state.meta.errors.map((err) => ({
											message: err,
										}))}
									/>
								</Field>
							)}
						</form.Field>

						{/* Index Type Selection */}
						<div>
							<Field>
								<FieldLabel htmlFor="index-types">Index Types</FieldLabel>
								<FieldDescription>
									Select which index types to enable for this project
								</FieldDescription>
								<div className="mt-2">
									<Select
										multiple
										value={selectedIndexTypes}
										onValueChange={(value) => {
											setSelectedIndexTypes(value as string[]);
										}}
										disabled={isSubmitting}
									>
										<SelectTrigger id="index-types" className="w-full">
											<SelectValue placeholder="Select index types">
												{selectedIndexTypes.length > 0
													? `${selectedIndexTypes.length} type${selectedIndexTypes.length > 1 ? "s" : ""} selected`
													: "Select index types"}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{ALL_INDEX_TYPES.map((indexType) => {
												const hasAccess = userAddons.has(indexType.id);
												return (
													<SelectItem
														key={indexType.id}
														value={indexType.id}
														disabled={!hasAccess}
													>
														<div className="flex flex-col gap-0.5">
															<div className="font-medium">
																{indexType.displayName}
																{!hasAccess && (
																	<span className="text-xs text-muted-foreground ml-2">
																		(Not available)
																	</span>
																)}
															</div>
															<div className="text-xs text-muted-foreground">
																{indexType.description}
															</div>
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
								{selectedIndexTypes.length === 0 && (
									<div className="mt-2 text-sm text-amber-600 dark:text-amber-500">
										Select at least one index type to continue
									</div>
								)}
							</Field>
						</div>

						{submitError && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{submitError}
							</div>
						)}
					</div>

					<div className="flex justify-end gap-3 mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isSubmitting ||
								(isEditMode
									? false
									: !selectedFile || selectedIndexTypes.length === 0)
							}
						>
							{isSubmitting
								? isEditMode
									? "Saving..."
									: "Creating..."
								: isEditMode
									? "Update Project"
									: "Create Project"}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
};
