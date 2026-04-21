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
import { AuthFormShell } from "@/app/_common/_components/auth-form/auth-form-shell";
import { useAuthToken } from "@/app/_common/_hooks/use-auth";
import { trpc } from "@/app/_common/_trpc/client";

const signInSchema = z.object({
	email: emailValidator,
	password: passwordValidator,
});

export const LoginForm = () => {
	const { saveToken } = useAuthToken();
	const router = useRouter();

	const signInMutation = trpc.auth.signIn.useMutation({
		onSuccess: (data) => {
			saveToken(data.token);
			form.reset();
			router.push("/projects");
		},
		onError: (error: { message: string }) => {
			console.error("Sign in failed:", error.message);
		},
	});

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			signInMutation.mutate(value);
		},
	});

	const isLoading = signInMutation.isPending;
	const apiError = signInMutation.error;

	return (
		<AuthFormShell
			title="Sign In"
			apiError={apiError}
			isLoading={isLoading}
			submitLabel="Sign In"
			footer={
				<FormFooter
					text="Don't have an account?"
					linkText="Sign up"
					linkHref="/signup"
				/>
			}
			onFormSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<form.Field
				name="email"
				validators={{
					onBlur: ({ value }) => {
						const result = signInSchema.shape.email.safeParse(value);
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
						const result = signInSchema.shape.password.safeParse(value);
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
