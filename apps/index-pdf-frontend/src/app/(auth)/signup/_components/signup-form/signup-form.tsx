"use client";

import { emailValidator, passwordValidator } from "@pubint/core";
import {
	Field,
	FieldError,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";
import { FormFooter } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthToken } from "@/app/_common/_hooks/use-auth-token";
import { trpc } from "@/app/_common/_trpc/client";
import { AuthFormShell } from "@/app/(auth)/_components/auth-form-shell";

const signUpSchema = z.object({
	name: z.string().optional(),
	email: emailValidator,
	password: passwordValidator,
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignupForm = () => {
	const { saveToken } = useAuthToken();
	const router = useRouter();

	const signUpMutation = trpc.auth.signUp.useMutation({
		onSuccess: (data) => {
			saveToken(data.token);
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
		<AuthFormShell
			title="Create Account"
			apiError={apiError}
			isLoading={isLoading}
			submitLabel="Create Account"
			footer={
				<FormFooter
					text="Already have an account?"
					linkText="Sign in"
					linkHref="/login"
				/>
			}
			onFormSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
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
						return result.success ? undefined : result.error.issues[0]?.message;
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
						return result.success ? undefined : result.error.issues[0]?.message;
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
		</AuthFormShell>
	);
};
