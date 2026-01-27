import type { Metadata } from "next";
import { Audiowide, Exo_2 } from "next/font/google";
import "./globals.css";
import { TrpcProvider } from "../providers/trpc-provider";

const exo2 = Exo_2({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
	variable: "--font-exo-2",
});

const audiowide = Audiowide({
	subsets: ["latin"],
	weight: ["400"],
	variable: "--font-audiowide",
});

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
		<html lang="en" className={`${exo2.variable} ${audiowide.variable}`}>
			<body className={exo2.className}>
				<TrpcProvider>{children}</TrpcProvider>
			</body>
		</html>
	);
}
