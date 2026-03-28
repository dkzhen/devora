import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/docs-source';
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
                <RootProvider>
                    <DocsLayout
                        tree={source.pageTree}
                        nav={{
                            title: (
                                <span className="font-bold text-base tracking-tight text-white">
                                    <span style={{ color: '#f36222' }}>Dev</span>
                                    <span style={{ color: '#5cb644' }}>o</span>
                                    <span style={{ color: '#007fc3' }}>ra</span>
                                    <span className="text-gray-400 font-normal text-xs ml-1.5">Docs</span>
                                </span>
                            ),
                            githubUrl: 'https://github.com/dkzhen',
                        }}
                    >
                        {children}
                    </DocsLayout>
                </RootProvider>
            </body>
        </html>
    );
}
