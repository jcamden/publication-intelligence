"use client";

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

	return (
		<div style={{ maxWidth: "400px", margin: "2rem auto" }}>
			<h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
			<form onSubmit={handleSubmit}>
				{isSignUp && (
					<div style={{ marginBottom: "1rem" }}>
						<label htmlFor="name">Name (optional)</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							style={{
								width: "100%",
								padding: "0.5rem",
								marginTop: "0.25rem",
							}}
						/>
					</div>
				)}
				<div style={{ marginBottom: "1rem" }}>
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
					/>
				</div>
				<div style={{ marginBottom: "1rem" }}>
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={8}
						style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
					/>
				</div>
				<button
					type="submit"
					disabled={signUpMutation.isPending || signInMutation.isPending}
					style={{
						width: "100%",
						padding: "0.75rem",
						backgroundColor: "#0070f3",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					{signUpMutation.isPending || signInMutation.isPending
						? "Loading..."
						: isSignUp
							? "Sign Up"
							: "Sign In"}
				</button>
			</form>
			<button
				type="button"
				onClick={() => setIsSignUp(!isSignUp)}
				style={{
					marginTop: "1rem",
					width: "100%",
					padding: "0.5rem",
					background: "none",
					border: "1px solid #ccc",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				{isSignUp
					? "Already have an account? Sign In"
					: "Need an account? Sign Up"}
			</button>
		</div>
	);
};
