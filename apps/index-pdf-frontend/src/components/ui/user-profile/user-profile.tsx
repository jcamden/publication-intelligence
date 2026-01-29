"use client";

import { useAuthToken } from "@/hooks/use-auth";
import { trpc } from "@/utils/trpc";

export const UserProfile = () => {
	const { clearToken } = useAuthToken();
	const { data: user, isLoading, error } = trpc.auth.me.useQuery();
	const signOutMutation = trpc.auth.signOut.useMutation({
		onSuccess: () => {
			clearToken();
			alert("Signed out successfully");
		},
	});

	if (isLoading) return <p>Loading...</p>;
	if (error) return <p>Not authenticated</p>;
	if (!user) return <p>No user data</p>;

	return (
		<div
			style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}
		>
			<h3>User Profile</h3>
			<p>
				<strong>Email:</strong> {user.email}
			</p>
			{user.name && (
				<p>
					<strong>Name:</strong> {user.name}
				</p>
			)}
			<p>
				<strong>ID:</strong> {user.id}
			</p>
			<button
				type="button"
				onClick={() => signOutMutation.mutate()}
				disabled={signOutMutation.isPending}
				style={{
					marginTop: "1rem",
					padding: "0.5rem 1rem",
					backgroundColor: "#ff4444",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				{signOutMutation.isPending ? "Signing out..." : "Sign Out"}
			</button>
		</div>
	);
};
