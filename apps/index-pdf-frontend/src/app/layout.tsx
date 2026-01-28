import type { Metadata } from "next";
import { Audiowide, Exo_2 } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeScript } from "../components/theme-script";
import { ThemeProvider } from "../providers/theme-provider";
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

const anurati = localFont({
	src: "../../public/fonts/Anurati-Regular.otf",
	variable: "--font-anurati",
	weight: "400",
	display: "swap",
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
		<html
			lang="en"
			className={`${exo2.variable} ${audiowide.variable} ${anurati.variable}`}
			suppressHydrationWarning
		>
			<head>
				<ThemeScript />
			</head>
			<body className={exo2.className}>
				<ThemeProvider>
					<TrpcProvider>{children}</TrpcProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
