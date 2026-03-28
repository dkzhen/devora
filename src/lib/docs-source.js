import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import * as LucideIcons from 'lucide-react';
import React from 'react';

const customIcons = {
    'TempMail': (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f36222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
            <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
        </svg>
    ),
    'ApiRef': (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
};

export const source = loader({
    baseUrl: '/docs',
    source: docs.toFumadocsSource(),
    icon(name) {
        if (!name) return;
        if (customIcons[name]) {
            const CustomIcon = customIcons[name];
            return <CustomIcon />;
        }
        if (name in LucideIcons) {
            const Icon = LucideIcons[name];
            return <Icon />;
        }
    },
});
