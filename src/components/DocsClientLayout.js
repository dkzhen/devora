'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import * as Icons from 'lucide-react';

export default function DocsClientLayout({ children, tree }) {
    return (
        <RootProvider>
            <DocsLayout
                tree={tree}
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
                sidebar={{
                    renderIcon: (icon) => {
                        if (!icon) return null;
                        const Icon = Icons[icon];
                        if (!Icon) return null;
                        return <Icon className="w-4 h-4" />;
                    }
                }}
            >
                {children}
            </DocsLayout>
        </RootProvider>
    );
}
