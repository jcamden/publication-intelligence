import type { Metadata } from "next";
import {
	Audiowide,
	Exo_2,
	Merriweather,
	Merriweather_Sans,
	Ubuntu,
} from "next/font/google";
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

const ubuntu = Ubuntu({
	subsets: ["latin"],
	weight: ["300", "400", "500", "700"],
	variable: "--font-ubuntu",
});

const merriweather = Merriweather({
	subsets: ["latin"],
	weight: ["300", "400", "700", "900"],
	variable: "--font-merriweather",
});

const merriweatherSans = Merriweather_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
	variable: "--font-merriweather-sans",
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
			className={`${exo2.variable} ${audiowide.variable} ${ubuntu.variable} ${merriweather.variable} ${merriweatherSans.variable} ${anurati.variable}`}
			suppressHydrationWarning
		>
			<head>
				<ThemeScript />
			</head>
			<body className={merriweatherSans.className}>
				<ThemeProvider>
					<TrpcProvider>{children}</TrpcProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
