import { source } from '@/lib/docs-source';
import DocsClientLayout from '@/components/DocsClientLayout';
import './docs/docs.css';

export const metadata = {
    title: {
        default: "Devora Docs",
        template: "%s | Devora Docs",
    },
    description: "Official documentation for the Devora platform.",
};

export default function RootDocsLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="flex flex-col min-h-screen">
                <DocsClientLayout tree={source.pageTree}>
                    {children}
                </DocsClientLayout>
            </body>
        </html>
    );
}
