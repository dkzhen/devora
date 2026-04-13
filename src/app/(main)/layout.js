import Sidebar from "@/components/Sidebar";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const passeroFont = localFont({
    src: "../../../public/fonts/PasseroOne-Regular.ttf",
    variable: "--font-passero",
});

export const metadata = {
    metadataBase: new URL("https://devora.my.id"), // ganti domain kamu

    title: {
        default: "Devora — One Platform. Endless Possibilities.",
        template: "%s | Devora",
    },

    description:
        "Devora is a unified platform to organize, automate, and manage tools and connected services in one place.",

    keywords: [
        "devora",
        "automation platform",
        "productivity tools",
        "workflow automation",
        "api client",
        "groq-intelligence tools",
        "developer tools",
        "digital workspace",
        "all in one platform",
        "automation dashboard",
        "bot tools",
        "saas platform",
    ],

    authors: [{ name: "Devora" }],
    creator: "Devora",
    publisher: "Devora",

    openGraph: {
        title: "Devora — One Platform. Endless Possibilities.",
        description:
            "Manage tools, automation, and integrations in one powerful platform.",
        url: "https://devora.my.id",
        siteName: "Devora",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Devora Platform",
            },
        ],
        locale: "en_US",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "Devora — One Platform. Endless Possibilities.",
        description:
            "Manage tools, automation, and integrations in one powerful platform.",
        images: ["/og-image.png"],
    },

    robots: {
        index: true,
        follow: true,
    },

    icons: {
        icon: "/icons/devora-icon.png",
        shortcut: "/icons/devora-icon.png",
        apple: "/icons/devora-icon.png",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${passeroFont.variable} dark`}>
            <body className="antialiased min-h-screen bg-[#0c0e1a] text-slate-100 flex flex-col md:flex-row">
                <Providers>
                    <Sidebar />
                    <main className="flex-1 md:ml-64 pt-20 md:pt-6 p-4 md:p-8 bg-[#0c0e1a] min-h-screen">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}