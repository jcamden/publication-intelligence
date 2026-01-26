"use client";

import { AuthForm } from "../components/auth/auth-form";
import { UserProfile } from "../components/auth/user-profile";
import { useAuthToken } from "../hooks/use-auth";

export default function Home() {
	const { isAuthenticated, isLoading } = useAuthToken();

	if (isLoading) {
		return <main style={{ padding: "2rem" }}>Loading...</main>;
	}

	return (
		<main style={{ padding: "2rem" }}>
			<h1>Publication Intelligence</h1>
			<p>PDF indexing and search platform</p>

			<div style={{ marginTop: "2rem" }}>
				{isAuthenticated ? <UserProfile /> : <AuthForm />}
			</div>
		</main>
	);
}
