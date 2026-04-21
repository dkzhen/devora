import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";
import "../(main)/globals.css";

const passeroFont = localFont({
    src: "../../../public/fonts/PasseroOne-Regular.ttf",
    variable: "--font-passero",
});

const spaceMono = Space_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-space-mono',
});

export const metadata = {
    metadataBase: new URL("https://devora.my.id"),

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

    manifest: "/manifest.json",

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
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },

    icons: {
        icon: "/icons/devora-icon.png",
        shortcut: "/icons/devora-icon.png",
        apple: "/icons/devora-icon.png",
    },

    alternates: {
        canonical: 'https://devora.my.id',
    },
};

export default function LandingLayout({ children }) {
    return (
        <html lang="en" className={`${passeroFont.variable} ${spaceMono.variable} dark`}>
            <body className={`${spaceMono.className} antialiased min-h-screen bg-[#0c0e1a] text-slate-100`}>
                {children}
            </body>
        </html>
    );
}
