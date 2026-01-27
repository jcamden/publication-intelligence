"use client";

import { AuthForm } from "../components/auth/auth-form";
import { UserProfile } from "../components/auth/user-profile";
import { useAuthToken } from "../hooks/use-auth";

export default function Home() {
	const { isAuthenticated, isLoading } = useAuthToken();

	if (isLoading) {
		return <main className="p-8">Loading...</main>;
	}

	return (
		<main className="p-8">
			<h1>Publication Intelligence</h1>
			<p>PDF indexing and search platform</p>

			<div className="pt-8">
				{isAuthenticated ? <UserProfile /> : <AuthForm />}
			</div>
		</main>
	);
}
