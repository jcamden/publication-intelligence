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

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginForm = () => {
	const { saveToken } = useAuthToken();
	const router = useRouter();

	const signInMutation = trpc.auth.signIn.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
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
		<div className="w-full max-w-md space-y-6">
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">Sign In</h1>
				{/* <p className="text-muted-foreground">
					Welcome back to Publication Intelligence
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
				<form.Field
					name="email"
					validators={{
						onBlur: ({ value }) => {
							const result = signInSchema.shape.email.safeParse(value);
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
							const result = signInSchema.shape.password.safeParse(value);
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
					{isLoading ? "Loading..." : "Sign In"}
				</Button>
			</form>

			<FormFooter
				text="Don't have an account?"
				linkText="Sign up"
				linkHref="/signup"
			/>
		</div>
	);
};
