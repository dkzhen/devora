'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function Providers({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [configs, setConfigs] = useState(null);
    const [user, setUser] = useState(null);

    // Initial load of user and configs
    useEffect(() => {
        const loadInitialData = async () => {
            // Load User
            let currentUser = null;
            try {
                const stored = localStorage.getItem('user_info');
                if (stored) currentUser = JSON.parse(stored);
            } catch { }

            if (!currentUser) {
                try {
                    const res = await fetch('/api/auth/me', { cache: 'no-store' });
                    if (res.ok) {
                        const d = await res.json();
                        currentUser = d.user;
                    }
                } catch { }
            }
            setUser(currentUser);

            // Load Configs
            try {
                const mRes = await fetch('/api/maintenance', { cache: 'no-store' });
                if (mRes.ok) {
                    const mData = await mRes.json();
                    setConfigs(mData);
                }
            } catch { }
        };

        if (!configs) loadInitialData();
    }, [configs]);

    // Check maintenance on route changes or config load
    useEffect(() => {
        if (!configs || !pathname) return;

        // ULTRA users skip maintenance blocks
        if (user && user.role === 'ULTRA') return;

        // Identify which feature relates to the current path
        const basePath = pathname.split('/')[1]; // e.g. "app-library" or "airdrops"
        if (!basePath) return;

        // We check if the current active feature matches the database configs
        const relevantConfig = configs.find(c => c.feature === basePath);

        if (relevantConfig && relevantConfig.enabled) {
            router.replace(`/maintenance?feature=${basePath}&message=${encodeURIComponent(relevantConfig.message || '')}`);
        }
    }, [pathname, configs, user, router]);

    return <>{children}</>;
}
