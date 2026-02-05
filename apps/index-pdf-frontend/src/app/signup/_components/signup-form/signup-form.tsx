"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Field,
	FieldError,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Alert, AlertDescription, FormFooter } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { trpc } from "@/app/_common/_utils/trpc";

const signUpSchema = z.object({
	name: z.string().optional(),
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignupForm = () => {
	const { saveToken } = useAuthToken();
	const router = useRouter();

	const signUpMutation = trpc.auth.signUp.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			form.reset();
			router.push("/projects");
		},
		onError: (error: { message: string }) => {
			console.error("Sign up failed:", error.message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			signUpMutation.mutate(value as SignUpFormData);
		},
	});

	const isLoading = signUpMutation.isPending;
	const apiError = signUpMutation.error;

	return (
		<div className="w-full max-w-md space-y-6">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">Create Account</h1>
				{/* <p className="text-muted-foreground">
					Start indexing smarter with Publication Intelligence
				</p> */}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<Field>
							<FieldLabel htmlFor="name">Name (optional)</FieldLabel>
							<Input
								id="name"
								type="text"
								placeholder="Enter your name"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
							/>
						</Field>
					)}
				</form.Field>

				<form.Field
					name="email"
					validators={{
						onBlur: ({ value }) => {
							const result = signUpSchema.shape.email.safeParse(value);
							return result.success
								? undefined
								: result.error.issues[0]?.message;
						},
					}}
				>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
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
					name="password"
					validators={{
						onBlur: ({ value }) => {
							const result = signUpSchema.shape.password.safeParse(value);
							return result.success
								? undefined
								: result.error.issues[0]?.message;
						},
					}}
				>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Input
								id="password"
								type="password"
								placeholder="Min 8 characters"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
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

				{apiError && (
					<Alert variant="error">
						<AlertDescription>{apiError.message}</AlertDescription>
					</Alert>
				)}

				<Button type="submit" disabled={isLoading} className="w-full">
					{isLoading ? "Loading..." : "Create Account"}
				</Button>
			</form>

			<FormFooter
				text="Already have an account?"
				linkText="Sign in"
				linkHref="/login"
			/>
		</div>
	);
};
