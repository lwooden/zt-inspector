import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
	variable: "--font-ibm-plex-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-ibm-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
	title: "ZT Inspector",
	description: "Zero Trust posture repository for software systems",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col font-sans">
				<AppHeader />
				<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
					{children}
				</main>
				<Toaster
					theme="light"
					position="top-right"
					toastOptions={{
						className:
							"border border-border bg-surface text-foreground shadow-none",
					}}
				/>
			</body>
		</html>
	);
}
