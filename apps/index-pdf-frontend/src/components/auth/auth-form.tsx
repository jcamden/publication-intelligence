"use client";

import { Button, Input, Logo } from "@pubint/pixel";
import { useState } from "react";
import { useAuthToken } from "../../hooks/use-auth";
import { trpc } from "../../utils/trpc";

export const AuthForm = () => {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const { saveToken } = useAuthToken();

	const signUpMutation = trpc.auth.signUp.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			alert("Sign up successful!");
		},
		onError: (error: { message: string }) => {
			alert(`Sign up failed: ${error.message}`);
		},
	});

	const signInMutation = trpc.auth.signIn.useMutation({
		onSuccess: (data: { authToken: string; message: string }) => {
			saveToken(data.authToken);
			alert("Sign in successful!");
		},
		onError: (error: { message: string }) => {
			alert(`Sign in failed: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isSignUp) {
			signUpMutation.mutate({ email, password, name });
		} else {
			signInMutation.mutate({ email, password });
		}
	};

	const isLoading = signUpMutation.isPending || signInMutation.isPending;

	return (
		<div className="max-w-md mx-auto mt-8 p-6 bg-surface rounded-lg shadow-lg">
			<div className="flex flex-col items-center gap-4 mb-6">
				<Logo variant="gradient" size="lg" />
				<h2 className="text-xl font-semibold text-text">
					{isSignUp ? "Sign Up" : "Sign In"}
				</h2>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
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
							value={name}
							onChange={setName}
							placeholder="Enter your name"
							size="md"
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
						value={email}
						onChange={setEmail}
						placeholder="you@example.com"
						required
						size="md"
					/>
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
						value={password}
						onChange={setPassword}
						placeholder="Min 8 characters"
						required
						size="md"
					/>
				</div>
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
				variant="primary"
				size="md"
				onClick={() => setIsSignUp(!isSignUp)}
				className="w-full mt-4"
			>
				{isSignUp
					? "Already have an account? Sign In"
					: "Need an account? Sign Up"}
			</Button>
		</div>
	);
};
