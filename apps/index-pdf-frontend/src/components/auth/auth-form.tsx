"use client";

import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pubint/yabasic/components/ui/card";
import {
	Field,
	FieldError,
	FieldLabel,
} from "@pubint/yabasic/components/ui/field";
import { Input } from "@pubint/yabasic/components/ui/input";
import { Logo } from "@pubint/yaboujee";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useAuthToken } from "../../hooks/use-auth";
import { trpc } from "../../utils/trpc";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = signInSchema.extend({
	name: z.string().optional(),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const AuthForm = () => {
	const [isSignUp, setIsSignUp] = useState(false);
	const { saveToken } = useAuthToken();

	const signUpMutation = trpc.auth.signUp.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			form.reset();
		},
		onError: (error: { message: string }) => {
			console.error("Sign up failed:", error.message);
		},
	});

	const signInMutation = trpc.auth.signIn.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			form.reset();
		},
		onError: (error: { message: string }) => {
			console.error("Sign in failed:", error.message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			if (isSignUp) {
				signUpMutation.mutate(value as SignUpFormData);
			} else {
				const { name, ...signInData } = value;
				signInMutation.mutate(signInData);
			}
		},
	});

	const isLoading = signUpMutation.isPending || signInMutation.isPending;
	const apiError = signUpMutation.error || signInMutation.error;

	return (
		<Card className="max-w-md mx-auto mt-8">
			<CardHeader className="flex flex-col items-center">
				<Logo variant="gradient" size="lg" />
				<CardTitle>{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
			</CardHeader>

			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					{isSignUp && (
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
					)}

					<form.Field
						name="email"
						validators={{
							onBlur: ({ value }) => {
								const schema = isSignUp
									? signUpSchema.shape.email
									: signInSchema.shape.email;
								const result = schema.safeParse(value);
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
								const schema = isSignUp
									? signUpSchema.shape.password
									: signInSchema.shape.password;
								const result = schema.safeParse(value);
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
						<div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
							<p className="text-destructive text-sm">{apiError.message}</p>
						</div>
					)}

					<Button type="submit" disabled={isLoading} className="w-full">
						{isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
					</Button>
				</form>

				<Button
					type="button"
					variant="ghost"
					onClick={() => {
						setIsSignUp(!isSignUp);
						form.reset();
					}}
					className="w-full mt-4"
				>
					{isSignUp
						? "Already have an account? Sign In"
						: "Need an account? Sign Up"}
				</Button>
			</CardContent>
		</Card>
	);
};
