"use client";

import {
	detectNumeralType,
	generateArabicNumerals,
	generateRomanNumerals,
	parseArbitrarySequence,
} from "@pubint/core";
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
import { Textarea } from "@pubint/yabasic/components/ui/textarea";
import { Modal } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/app/_common/_utils/trpc";

export type CanonicalPageRuleModalProps = {
	open: boolean;
	onClose: () => void;
	projectId: string;
	documentPageCount?: number;
	ruleId?: string; // If provided, edit mode
	initialDocumentPageStart?: number; // Pre-fill for quick create
	initialDocumentPageEnd?: number;
};

export const CanonicalPageRuleModal = ({
	open,
	onClose,
	projectId,
	documentPageCount = 1,
	ruleId,
	initialDocumentPageStart,
	initialDocumentPageEnd,
}: CanonicalPageRuleModalProps) => {
	const utils = trpc.useUtils();
	const isEditMode = !!ruleId;
	const [showConflictWarning, setShowConflictWarning] = useState(false);
	const [conflictInfo, setConflictInfo] = useState<{
		pages: number[];
		existingRules: Array<{
			id: string;
			ruleType: "positive" | "negative";
			documentPageStart: number;
			documentPageEnd: number;
			label?: string;
		}>;
	} | null>(null);

	// Fetch rule data if editing
	const { data: existingRule } = trpc.canonicalPageRule.list.useQuery(
		{ projectId },
		{
			enabled: isEditMode && !!projectId,
			select: (rules) => rules.find((r) => r.id === ruleId),
		},
	);

	const createRule = trpc.canonicalPageRule.create.useMutation({
		onSuccess: () => {
			utils.canonicalPageRule.list.invalidate({ projectId });
		},
		onError: (error) => {
			if (error.data?.code === "CONFLICT") {
				const cause = (error.data as { cause?: typeof conflictInfo }).cause;
				if (cause) {
					setConflictInfo(cause);
					setShowConflictWarning(true);
				}
			}
		},
	});

	const updateRule = trpc.canonicalPageRule.update.useMutation({
		onSuccess: () => {
			utils.canonicalPageRule.list.invalidate({ projectId });
		},
		onError: (error) => {
			if (error.data?.code === "CONFLICT") {
				const cause = (error.data as { cause?: typeof conflictInfo }).cause;
				if (cause) {
					setConflictInfo(cause);
					setShowConflictWarning(true);
				}
			}
		},
	});

	const form = useForm({
		defaultValues: {
			ruleType: "positive" as "positive" | "negative",
			documentPageStart: initialDocumentPageStart || 1,
			documentPageEnd: initialDocumentPageEnd || 1,
			label: "",
			sequenceMode: "auto" as "auto" | "arbitrary",
			numeralType: "arabic" as "arabic" | "roman",
			startingCanonicalPage: "1",
			arbitrarySequence: "",
		},
		onSubmit: async ({ value }) => {
			// Prepare arbitrarySequence if in arbitrary mode
			const arbitrarySequence =
				value.ruleType === "positive" && value.sequenceMode === "arbitrary"
					? parseArbitrarySequence({ input: value.arbitrarySequence })
					: undefined;

			const input = {
				projectId,
				ruleType: value.ruleType,
				documentPageStart: value.documentPageStart,
				documentPageEnd: value.documentPageEnd,
				label: value.label || undefined,
				...(value.ruleType === "positive" && {
					numeralType:
						value.sequenceMode === "arbitrary"
							? ("arbitrary" as const)
							: value.numeralType,
					startingCanonicalPage:
						value.sequenceMode === "auto"
							? value.startingCanonicalPage
							: undefined,
					arbitrarySequence,
				}),
			};

			if (isEditMode && ruleId) {
				await updateRule.mutateAsync({
					id: ruleId,
					...input,
				});
			} else {
				await createRule.mutateAsync(input);
			}

			handleClose();
		},
	});

	// Pre-fill form when editing
	useEffect(() => {
		if (existingRule && isEditMode) {
			form.setFieldValue("ruleType", existingRule.ruleType);
			form.setFieldValue("documentPageStart", existingRule.documentPageStart);
			form.setFieldValue("documentPageEnd", existingRule.documentPageEnd);
			form.setFieldValue("label", existingRule.label || "");

			if (existingRule.ruleType === "positive") {
				const isArbitrary = existingRule.numeralType === "arbitrary";
				form.setFieldValue("sequenceMode", isArbitrary ? "arbitrary" : "auto");

				if (isArbitrary && existingRule.arbitrarySequence) {
					form.setFieldValue(
						"arbitrarySequence",
						existingRule.arbitrarySequence.join(", "),
					);
				} else {
					if (
						existingRule.numeralType &&
						(existingRule.numeralType === "arabic" ||
							existingRule.numeralType === "roman")
					) {
						form.setFieldValue("numeralType", existingRule.numeralType);
					}
					if (existingRule.startingCanonicalPage) {
						form.setFieldValue(
							"startingCanonicalPage",
							existingRule.startingCanonicalPage,
						);
					}
				}
			}
		}
	}, [existingRule, isEditMode, form]);

	const handleClose = useCallback(() => {
		form.reset();
		setShowConflictWarning(false);
		setConflictInfo(null);
		onClose();
	}, [form, onClose]);

	// Generate preview of canonical pages
	const previewPages = useMemo(() => {
		const pageCount =
			form.getFieldValue("documentPageEnd") -
			form.getFieldValue("documentPageStart") +
			1;

		if (pageCount <= 0 || pageCount > 1000) return null;

		const ruleType = form.getFieldValue("ruleType");
		if (ruleType === "negative") {
			return `Pages will be ignored (not indexed)`;
		}

		const sequenceMode = form.getFieldValue("sequenceMode");

		if (sequenceMode === "arbitrary") {
			const arbitraryInput = form.getFieldValue("arbitrarySequence");
			if (!arbitraryInput.trim()) return null;

			const sequence = parseArbitrarySequence({ input: arbitraryInput });
			if (sequence.length !== pageCount) {
				return `⚠️ Count mismatch: ${sequence.length} canonical pages for ${pageCount} document pages`;
			}
			return (
				sequence.slice(0, 10).join(", ") + (sequence.length > 10 ? "..." : "")
			);
		}

		// Auto-generate mode
		const numeralType = form.getFieldValue("numeralType");
		const startingPage = form.getFieldValue("startingCanonicalPage");

		try {
			if (numeralType === "arabic") {
				const start = Number.parseInt(startingPage, 10);
				if (Number.isNaN(start)) return "Invalid starting page";
				const sequence = generateArabicNumerals({ start, count: pageCount });
				return (
					sequence.slice(0, 10).join(", ") + (sequence.length > 10 ? "..." : "")
				);
			}

			if (numeralType === "roman") {
				const sequence = generateRomanNumerals({
					start: startingPage,
					count: pageCount,
				});
				return (
					sequence.slice(0, 10).join(", ") + (sequence.length > 10 ? "..." : "")
				);
			}
		} catch (error) {
			return `⚠️ Error: ${error instanceof Error ? error.message : "Invalid input"}`;
		}

		return null;
	}, [form]);

	const isPending = createRule.isPending || updateRule.isPending;

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={
				isEditMode ? "Edit Canonical Page Rule" : "Create Canonical Page Rule"
			}
			size="xl"
			footer={
				showConflictWarning ? null : (
					<>
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isPending}
						>
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
				)
			}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Rule Type */}
				<form.Field name="ruleType">
					{(field) => (
						<Field>
							<FieldLabel>Rule Type</FieldLabel>
							<RadioGroup
								value={field.state.value}
								onValueChange={(value) =>
									field.handleChange(value as typeof field.state.value)
								}
							>
								<Label className="flex items-center space-x-2 cursor-pointer py-2">
									<RadioGroupItem value="positive" id="positive" />
									<span>Positive (Define page numbers)</span>
								</Label>
								<Label className="flex items-center space-x-2 cursor-pointer py-2">
									<RadioGroupItem value="negative" id="negative" />
									<span>Negative (Ignore pages)</span>
								</Label>
							</RadioGroup>
						</Field>
					)}
				</form.Field>

				{/* Document Page Range */}
				<div className="grid grid-cols-2 gap-4">
					<form.Field
						name="documentPageStart"
						validators={{
							onSubmit: ({ value }) => {
								if (!value || value < 1) {
									return "Start page must be >= 1";
								}
								if (value > documentPageCount) {
									return `Cannot exceed ${documentPageCount}`;
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<Field>
								<FieldLabel>Document Page Start</FieldLabel>
								<Input
									type="number"
									min={1}
									max={documentPageCount}
									value={field.state.value}
									onChange={(e) =>
										field.handleChange(Number.parseInt(e.target.value, 10))
									}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError>{field.state.meta.errors[0]}</FieldError>
								)}
							</Field>
						)}
					</form.Field>

					<form.Field
						name="documentPageEnd"
						validators={{
							onSubmit: ({ value }) => {
								const start = form.getFieldValue("documentPageStart");
								if (!value || value < 1) {
									return "End page must be >= 1";
								}
								if (value < start) {
									return "End must be >= start";
								}
								if (value > documentPageCount) {
									return `Cannot exceed ${documentPageCount}`;
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<Field>
								<FieldLabel>Document Page End</FieldLabel>
								<Input
									type="number"
									min={1}
									max={documentPageCount}
									value={field.state.value}
									onChange={(e) =>
										field.handleChange(Number.parseInt(e.target.value, 10))
									}
									onBlur={field.handleBlur}
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError>{field.state.meta.errors[0]}</FieldError>
								)}
							</Field>
						)}
					</form.Field>
				</div>

				{/* Label */}
				<form.Field name="label">
					{(field) => (
						<Field>
							<FieldLabel>Label (optional)</FieldLabel>
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="e.g., Appendix, Index Section, Cover Pages"
							/>
						</Field>
					)}
				</form.Field>

				{/* Positive Rule Options */}
				<form.Field name="ruleType">
					{(ruleTypeField) =>
						ruleTypeField.state.value === "positive" && (
							<div className="border-t pt-4">
								<h3 className="text-sm font-semibold mb-4">
									Canonical Page Numbers
								</h3>

								{/* Sequence Mode */}
								<form.Field name="sequenceMode">
									{(field) => (
										<Field>
											<FieldLabel>Sequence Mode</FieldLabel>
											<RadioGroup
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(value as typeof field.state.value)
												}
											>
												<Label className="flex items-center space-x-2 cursor-pointer py-2">
													<RadioGroupItem value="auto" id="auto" />
													<span>Auto-generate sequence</span>
												</Label>
												<Label className="flex items-center space-x-2 cursor-pointer py-2">
													<RadioGroupItem value="arbitrary" id="arbitrary" />
													<span>Enter arbitrary sequence</span>
												</Label>
											</RadioGroup>
										</Field>
									)}
								</form.Field>

								<form.Field name="sequenceMode">
									{(sequenceModeField) => (
										<>
											{sequenceModeField.state.value === "auto" && (
												<>
													{/* Numeral Type */}
													<form.Field name="numeralType">
														{(field) => (
															<Field>
																<FieldLabel>Numeral Type</FieldLabel>
																<Select
																	value={field.state.value}
																	onValueChange={(value) =>
																		field.handleChange(
																			value as typeof field.state.value,
																		)
																	}
																>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="arabic">
																			Arabic (1, 2, 3...)
																		</SelectItem>
																		<SelectItem value="roman">
																			Roman (i, ii, iii...)
																		</SelectItem>
																	</SelectContent>
																</Select>
															</Field>
														)}
													</form.Field>

													{/* Starting Canonical Page */}
													<form.Field
														name="startingCanonicalPage"
														validators={{
															onSubmit: ({ value }) => {
																if (!value || !value.trim()) {
																	return "Starting page is required";
																}
																const numeralType =
																	form.getFieldValue("numeralType");
																const detectedType = detectNumeralType({
																	page: value,
																});
																if (
																	numeralType === "arabic" &&
																	detectedType !== "arabic"
																) {
																	return "Must be a valid arabic number";
																}
																if (
																	numeralType === "roman" &&
																	detectedType !== "roman"
																) {
																	return "Must be a valid roman numeral";
																}
																return undefined;
															},
														}}
													>
														{(field) => (
															<Field>
																<FieldLabel>Starting Canonical Page</FieldLabel>
																<Input
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																	onBlur={field.handleBlur}
																	placeholder="e.g., 1, i, v"
																/>
																{field.state.meta.errors.length > 0 && (
																	<FieldError>
																		{field.state.meta.errors[0]}
																	</FieldError>
																)}
															</Field>
														)}
													</form.Field>
												</>
											)}

											{sequenceModeField.state.value === "arbitrary" && (
												<form.Field
													name="arbitrarySequence"
													validators={{
														onSubmit: ({ value }) => {
															if (!value || !value.trim()) {
																return "Canonical pages are required";
															}
															const sequence = parseArbitrarySequence({
																input: value,
															});
															const pageCount =
																form.getFieldValue("documentPageEnd") -
																form.getFieldValue("documentPageStart") +
																1;
															if (sequence.length !== pageCount) {
																return `Must provide exactly ${pageCount} values (got ${sequence.length})`;
															}
															return undefined;
														},
													}}
												>
													{(field) => (
														<Field>
															<FieldLabel>
																Canonical Pages (comma-separated)
															</FieldLabel>
															<Textarea
																value={field.state.value}
																onChange={(e) =>
																	field.handleChange(e.target.value)
																}
																onBlur={field.handleBlur}
																placeholder="e.g., 10, 10a, 10b, 11 or A-1, A-2, A-3"
																rows={3}
															/>
															<p className="text-xs text-muted-foreground mt-1">
																Must provide exactly{" "}
																{form.getFieldValue("documentPageEnd") -
																	form.getFieldValue("documentPageStart") +
																	1}{" "}
																values
															</p>
															{field.state.meta.errors.length > 0 && (
																<FieldError>
																	{field.state.meta.errors[0]}
																</FieldError>
															)}
														</Field>
													)}
												</form.Field>
											)}
										</>
									)}
								</form.Field>
							</div>
						)
					}
				</form.Field>

				{/* Preview */}
				{previewPages && (
					<div className="p-3 bg-muted rounded-md">
						<div className="flex items-start gap-2">
							<Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<p className="text-xs font-semibold text-muted-foreground mb-1">
									Preview
								</p>
								<p className="text-sm text-foreground font-mono break-all">
									{previewPages}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Conflict Warning */}
				{showConflictWarning && conflictInfo && (
					<div className="p-4 border border-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded-md">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
									⚠️ Rule Conflict Detected
								</h4>
								<p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
									Document pages{" "}
									{conflictInfo.pages.length > 5
										? `${conflictInfo.pages.slice(0, 5).join(", ")}... (${conflictInfo.pages.length} total)`
										: conflictInfo.pages.join(", ")}{" "}
									are already part of existing rules:
								</p>
								<ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 mb-3">
									{conflictInfo.existingRules.map((rule) => (
										<li key={rule.id}>
											• {rule.ruleType === "positive" ? "Positive" : "Negative"}{" "}
											rule: {rule.documentPageStart}-{rule.documentPageEnd}
											{rule.label && ` (${rule.label})`}
										</li>
									))}
								</ul>
								<p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
									Please adjust the page range to avoid conflicts.
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setShowConflictWarning(false);
											setConflictInfo(null);
										}}
									>
										OK
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</form>
		</Modal>
	);
};
