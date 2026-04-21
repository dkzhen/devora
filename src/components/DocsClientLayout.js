'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { HomeIcon, KeyIcon, RocketIcon } from 'lucide-react';
import Image from 'next/image';

export default function DocsClientLayout({ children, tree }) {
    return (
        <RootProvider
            search={{
                enabled: true,
            }}
        >
            <DocsLayout
                tree={tree}
                nav={{
                    title: (
                        <div className="flex items-center gap-2">
                            <Image 
                                src="/icons/devora-icon.png" 
                                alt="Devora" 
                                width={28} 
                                height={28}
                                className="rounded-lg"
                            />
                            <span className="font-bold text-base tracking-tight text-foreground">
                                Devora
                                <span className="text-muted-foreground font-normal text-sm ml-1.5">Docs</span>
                            </span>
                        </div>
                    ),
                    githubUrl: 'https://github.com/dkzhen',
                    transparentMode: 'top',
                }}
                links={[]}
                sidebar={{
                    banner: (
                        <div className="px-2 -mb-4">
                            <p className="text-xs font-semibold tracking-wide text-muted-foreground/70 mb-1">
                                Introduction
                            </p>
                        </div>
                    ),
                    footer: (
                        <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground">
                            <a href="https://devora.my.id" className="hover:text-foreground transition-colors">
                                ← Back to Dashboard
                            </a>
                            <a href="https://github.com/dkzhen" className="hover:text-foreground transition-colors">
                                GitHub
                            </a>
                        </div>
                    ),
                }}
            >
                {children}
            </DocsLayout>
        </RootProvider>
    );
}
