"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Logo } from "@pubint/pixel";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<SignUpFormData>({
		resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
		mode: "onBlur",
	});

	const signUpMutation = trpc.auth.signUp.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			reset();
		},
		onError: (error: { message: string }) => {
			console.error("Sign up failed:", error.message);
		},
	});

	const signInMutation = trpc.auth.signIn.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			reset();
		},
		onError: (error: { message: string }) => {
			console.error("Sign in failed:", error.message);
		},
	});

	const onSubmit = (data: SignUpFormData) => {
		if (isSignUp) {
			signUpMutation.mutate(data);
		} else {
			const { name, ...signInData } = data;
			signInMutation.mutate(signInData);
		}
	};

	const isLoading = signUpMutation.isPending || signInMutation.isPending;
	const apiError = signUpMutation.error || signInMutation.error;

	return (
		<div className="max-w-md mx-auto mt-8 p-6 bg-surface rounded-lg shadow-lg">
			<div className="flex flex-col items-center gap-4 mb-6">
				<Logo variant="gradient" size="lg" />
				<h2 className="text-xl font-semibold text-text">
					{isSignUp ? "Sign Up" : "Sign In"}
				</h2>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{isSignUp && (
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-text mb-1"
						>
							Name (optional)
						</label>
						<Input
							id="name"
							type="text"
							placeholder="Enter your name"
							size="md"
							{...register("name")}
						/>
					</div>
				)}

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-text mb-1"
					>
						Email
					</label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						size="md"
						variant={errors.email ? "error" : "default"}
						{...register("email")}
					/>
					{errors.email && (
						<p className="text-error text-sm mt-1">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-text mb-1"
					>
						Password
					</label>
					<Input
						id="password"
						type="password"
						placeholder="Min 8 characters"
						size="md"
						variant={errors.password ? "error" : "default"}
						{...register("password")}
					/>
					{errors.password && (
						<p className="text-error text-sm mt-1">{errors.password.message}</p>
					)}
				</div>

				{apiError && (
					<div className="p-3 bg-error/10 border border-error rounded-lg">
						<p className="text-error text-sm">{apiError.message}</p>
					</div>
				)}

				<Button
					type="submit"
					variant="primary"
					size="lg"
					disabled={isLoading}
					className="w-full"
				>
					{isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
				</Button>
			</form>

			<Button
				type="button"
				variant="ghost"
				size="md"
				onClick={() => {
					setIsSignUp(!isSignUp);
					reset();
				}}
				className="w-full mt-4"
			>
				{isSignUp
					? "Already have an account? Sign In"
					: "Need an account? Sign Up"}
			</Button>
		</div>
	);
};
