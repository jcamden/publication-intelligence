import type { Metadata } from "next";
import "./globals.css";
import { TrpcProvider } from "../providers/trpc-provider";

export const metadata: Metadata = {
	title: "Publication Intelligence",
	description: "PDF indexing and search powered by AI",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<TrpcProvider>{children}</TrpcProvider>
			</body>
		</html>
	);
}
