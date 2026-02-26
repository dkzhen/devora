import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata = {
    title: "Devora - Track Work",
    description: "Track your work efficiently",
};

import { Providers } from "./providers";

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased min-h-screen bg-[#080d1a] text-gray-100 flex flex-col md:flex-row">
                <Providers>
                    <Sidebar />
                    <main className="flex-1 md:ml-64 pt-20 md:pt-6 p-4 md:p-8 bg-[#080d1a] min-h-screen">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
