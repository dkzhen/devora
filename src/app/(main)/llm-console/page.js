'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { HeroHeader, LoadingState } from '@/components/HeroHeader';

// ── Local-storage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'llm_console_config';
const LS_SALT = 'devora_llm_v1';

function lsEncrypt(str) {
    if (!str) return str;
    try {
        const xor = (s) => s.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ LS_SALT.charCodeAt(i % LS_SALT.length))
        ).join('');
        return btoa(encodeURIComponent(xor(str)));
    } catch { return str; }
}

function lsDecrypt(str) {
    if (!str) return str;
    try {
        const decoded = decodeURIComponent(atob(str));
        const dexor = (s) => s.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ LS_SALT.charCodeAt(i % LS_SALT.length))
        ).join('');
        return dexor(decoded);
    } catch { return str; }
}

function lsLoad() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        // Decrypt key if present
        if (data && data.apiKey) {
            data.apiKey = lsDecrypt(data.apiKey);
        }
        return data;
    } catch { return null; }
}

function lsSave(data) {
    try {
        const toSave = { ...data };
        if (toSave.apiKey) {
            toSave.apiKey = lsEncrypt(toSave.apiKey);
        }
        localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    } catch { }
}

function lsClear() {
    try { localStorage.removeItem(LS_KEY); } catch { }
}

// ── Small UI helpers ───────────────────────────────────────────────────────────
function StatusPill({ code }) {
    const ok = code >= 200 && code < 300;
    const warn = code >= 400 && code < 500;
    const cls = ok
        ? 'bg-[#76D2DB]/15 text-[#76D2DB] border-[#76D2DB]/40'
        : warn
            ? 'bg-[#DA4848]/15 text-[#DA4848] border-[#DA4848]/40'
            : 'bg-gray-500/15 text-slate-400 border-gray-500/30';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border font-mono ${cls}`}>
            {ok ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {code}
        </span>
    );
}

function CopyBtn({ value, label = 'Copy' }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 hover:bg-[#76D2DB]/5 transition-all"
        >
            {copied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            )}
            {copied ? 'Copied!' : label}
        </button>
    );
}

// Logged-in only: fetches full decrypted key from server before copying
function ApiKeyCopyBtn() {
    const [state, setState] = useState('idle'); // idle | loading | done | error
    const copy = async () => {
        setState('loading');
        try {
            const res = await fetch('/api/llm-console/config?raw=true', { cache: 'no-store' });
            const data = await res.json();
            if (data.apiKey) {
                await navigator.clipboard.writeText(data.apiKey);
                setState('done');
                setTimeout(() => setState('idle'), 2000);
            } else {
                setState('error');
                setTimeout(() => setState('idle'), 2000);
            }
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        }
    };
    const icons = {
        idle: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
        loading: <span className="w-3 h-3 rounded-full border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin inline-block" />,
        done: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
        error: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
    };
    const labels = { idle: 'Copy', loading: '...', done: 'Copied!', error: 'Failed' };
    const colorCls = state === 'error'
        ? 'border-[#DA4848]/40 text-[#DA4848]/70 hover:text-[#DA4848]'
        : 'border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 hover:bg-[#76D2DB]/5';
    return (
        <button
            onClick={copy}
            disabled={state === 'loading'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-60 ${colorCls}`}
        >
            {icons[state]}
            {labels[state]}
        </button>
    );
}

// ── Provider Shortcuts ───────────────────────────────────────────────────────
const PROVIDERS = [
    {
        id: 'devora',
        name: 'Devora',
        baseUrl: 'https://devora.my.id/api/v1/ai',
        model: 'gpt-4o',
        icon: (
            <img src="/icons/devora-icon.png" className="w-4 h-4" alt="Devora" />
        )
    },
    {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
            </svg>
        )
    },
    {
        id: 'gemini',
        name: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-2.0-flash-exp',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#3098de" d="M45.963,23.959C34.056,23.489,24.51,13.944,24.041,2.037L24,1l-0.041,1.037	C23.49,13.944,13.944,23.489,2.037,23.959L1,24l1.037,0.041c11.907,0.47,21.452,10.015,21.922,21.922L24,47l0.041-1.037	c0.47-11.907,10.015-21.452,21.922-21.922L47,24L45.963,23.959z"></path>
            </svg>
        )
    },
    {
        id: 'fireworks',
        name: 'Fireworks',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 512 512" fill="#5019c5">
                <path d="M314.333 110.167L255.98 251.729l-58.416-141.562h-37.459l64 154.75c5.23 12.854 17.771 21.312 31.646 21.312s26.417-8.437 31.646-21.27l64.396-154.792h-37.459zm24.917 215.666L446 216.583l-14.562-34.77-116.584 119.562c-9.708 9.958-12.541 24.833-7.146 37.646 5.292 12.73 17.792 21.083 31.584 21.083l.042.063L506 359.75l-14.562-34.77-152.146.853h-.042zM66 216.5l14.563-34.77 116.583 119.562a34.592 34.592 0 017.146 37.646C199 351.667 186.5 360.02 172.708 360.02l-166.666-.375-.042.042 14.563-34.771 152.145.875L66 216.5z"/>
            </svg>
        )
    },
    {
        id: 'xai',
        name: 'xAI',
        baseUrl: 'https://api.x.ai/v1',
        model: 'grok-beta',
        icon: (
            <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/grok-icon.png" className="w-4 h-4" alt="Grok" />
        )
    },
    {
        id: 'groq',
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        icon: (
            <img src="https://cdn.brandfetch.io/idxygbEPCQ/w/201/h/201/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1668515712972" className="w-4 h-4" alt="Groq" />
        )
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        icon: (
            <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.png" className="w-4 h-4" alt="Claude AI" />
        )
    },
    {
        id: 'blink',
        name: 'Blink',
        baseUrl: 'https://core.blink.new/api/v1/ai',
        model: 'anthropic/claude-sonnet-4.6',
        icon: (
            <img src="https://blink.new/blink/blink-logo-icon--dark.svg" className="w-4 h-4" alt="Blink" />
        )
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemini-2.0-flash-001',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                <g clipPath="url(#prefix__clip0_8_13)"><path fillRule="evenodd" clipRule="evenodd" d="M358.485 41.75l154.027 87.573v1.856l-155.605 86.634.362-45.162-17.514-.64c-22.592-.598-34.368.042-48.384 2.346-22.699 3.734-43.478 12.31-67.136 28.843l-46.208 32.107c-6.059 4.16-10.56 7.168-14.507 9.706l-10.987 6.87-8.469 4.992 8.213 4.906 11.307 7.211c10.155 6.699 24.96 16.981 57.621 39.808 23.68 16.533 44.438 25.109 67.136 28.843l6.4.96c14.806 1.941 29.334 2.005 60.267.704l.469-46.059 154.027 87.573v1.856l-155.605 86.656.298-39.722-13.546.469c-29.568.896-45.59.043-66.944-3.456-36.139-5.973-69.547-19.755-104.128-43.925l-46.038-32a467.072 467.072 0 00-16.106-10.624l-9.963-5.974c-5.38-3.1-10.785-6.157-16.213-9.173C62.037 314.24 12.01 301.141 0 301.141v-90.197l2.987.085c12.032-.149 62.08-13.269 81.258-23.978l21.675-12.374 9.344-5.845c9.131-5.973 22.869-15.488 57.301-39.531 34.582-24.17 67.968-37.973 104.128-43.925 24.576-4.053 42.112-4.544 81.366-2.944l.426-40.683z"/></g>
                <defs><clipPath id="prefix__clip0_8_13"><path fill="#fff" d="M0 0h512v512H0z"/></clipPath></defs>
            </svg>
        )
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 512 509.64">
                <path fill="#fff" d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.613-115.613 115.613H115.612C52.026 509.64 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"/>
                <path fill="#4D6BFE" d="M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z"/>
            </svg>
        )
    },
];

export default function LlmConsolePage() {
    // Auth state
    const [user, setUser] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    // Config state
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [editing, setEditing] = useState(false);

    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyMasked, setApiKeyMasked] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

    // Test state
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);

    // ── Load auth ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch { }
            setAuthLoaded(true);
        };
        fetchUser();
    }, []);

    // ── Load config ────────────────────────────────────────────────────────────
    const loadConfig = useCallback(async (loggedIn) => {
        if (loggedIn) {
            try {
                const res = await fetch('/api/llm-console/config', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.isConfigured) {
                        setIsConfigured(true);
                        setBaseUrl(data.baseUrl);
                        setModel(data.model);
                        setApiKeyMasked(data.apiKey);
                    }
                }
            } catch { }
        } else {
            const saved = lsLoad();
            if (saved) {
                setIsConfigured(true);
                setBaseUrl(saved.baseUrl || '');
                setModel(saved.model || '');
                setApiKey(saved.apiKey || '');
                setApiKeyMasked(saved.apiKey
                    ? `${saved.apiKey.substring(0, 4)}••••••••${saved.apiKey.slice(-4)}`
                    : '');
            }
        }
        setConfigLoaded(true);
    }, []);

    useEffect(() => {
        if (authLoaded) loadConfig(!!user);
    }, [authLoaded, user, loadConfig]);

    // ── Save config ────────────────────────────────────────────────────────────
    const handleSave = async () => {
        // Basic validation
        if (!baseUrl.trim() || !model.trim()) {
            toast.error('Base URL and Model are required');
            return;
        }
        if (!isConfigured && !apiKey.trim()) {
            toast.error('API Key is required for first-time setup');
            return;
        }

        setSaving(true);
        setSaveStatus('saving');
        
        try {
            if (user) {
                const payload = {
                    baseUrl: baseUrl.trim(),
                    model: model.trim()
                };
                if (apiKey.trim()) payload.apiKey = apiKey.trim();

                const res = await fetch('/api/llm-console/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to save');
            } else {
                const current = lsLoad() || {};
                lsSave({ 
                    baseUrl: baseUrl.trim(), 
                    model: model.trim(), 
                    apiKey: apiKey.trim() || current.apiKey 
                });
            }

            // Sync back the global state
            await loadConfig(!!user);
            
            // Show success state
            setSaveStatus('saved');
            toast.success('Configuration synchronized');

            // Close after delay
            setTimeout(() => {
                setEditing(false);
                setSaveStatus('idle');
                setSaving(false);
                if (user) {
                    setApiKey('');
                    setShowKey(false);
                }
            }, 800);

        } catch (err) {
            toast.error(err.message || 'Save failed');
            setSaving(false);
            setSaveStatus('idle');
        }
    };

    const handleStartEdit = () => {
        // Sync state from current saved config before opening form
        if (isConfigured) {
            // Data should already be in state from loadConfig, 
            // but we ensure apiKey is cleared for the placeholder logic
            setApiKey('');
            setShowKey(false);
        }
        setEditing(true);
    };

    // ── Delete / reset config ──────────────────────────────────────────────────
    const handleReset = async () => {
        if (!confirm('Remove your saved LLM configuration?')) return;
        if (user) {
            try {
                await fetch('/api/llm-console/config', { method: 'DELETE' });
            } catch { }
        } else {
            lsClear();
        }
        setIsConfigured(false);
        setBaseUrl('');
        setModel('');
        setApiKey('');
        setApiKeyMasked('');
        setResult(null);
        setEditing(false);
        toast.success('Configuration removed');
    };

    const selectProvider = (p) => {
        setBaseUrl(p.baseUrl);
        setModel(p.model);
        toast.success(`Loaded ${p.name} defaults`);
    };

    // ── Test endpoint ──────────────────────────────────────────────────────────
    const handleTest = async () => {
        setTesting(true);
        setResult(null);
        try {
            const body = user ? {} : {
                baseUrl,
                model,
                apiKey,
            };

            const res = await fetch('/api/llm-console/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                toast.success('Endpoint is working!');
            } else {
                toast.error(`Error ${data.statusCode}: ${data.error}`);
            }
        } catch (err) {
            setResult({ success: false, statusCode: 0, error: err.message });
            toast.error('Network error');
        } finally {
            setTesting(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (!authLoaded || !configLoaded) {
        return (
            <div className="flex flex-col gap-6">
                <HeroHeader
                    
                    breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                    title="LLM"
                    badge="Console"
                    description="Test any OpenAI-compatible API endpoint in seconds."
                />
                <LoadingState message="Initializing console..."  />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-12">
            <HeroHeader
                
                breadcrumbs={[{ label: 'DASHBOARD', href: '/' }, { label: 'LLM CONSOLE' }]}
                title="LLM"
                badge="Console"
                description="Test any OpenAI-compatible API endpoint. Supports custom base URL, model selection, and optional API key storage."
            />

            {/* Gradient Banner */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 h-28 md:h-24">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #36064D 0%, #76D2DB33 30%, #DA484833 70%, #36064D 100%)',
                }} />
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                    backgroundImage: 'linear-gradient(rgba(118,210,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(118,210,219,0.08) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }} />
                <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full blur-[60px]" style={{ background: '#76D2DB22' }} />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-[60px]" style={{ background: '#DA484822' }} />
                <div className="relative z-10 h-full flex items-center px-5 py-5 md:px-8 md:py-0 gap-4">
                    <div className="w-10 h-10 rounded-lg border border-[#76D2DB]/40 flex items-center justify-center bg-[#76D2DB]/10 shrink-0">
                        <svg className="w-5 h-5 text-[#76D2DB]" viewBox="0 0 48 48" fill="currentColor">
                            <path d="M45.6,18.7,41,14.9V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2L24,5.9,18.5,2.2,17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4L2.4,18.7a.8.8,0,0,0-.4.8v9H2a.8.8,0,0,0,.4.8L7,33.1v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2L24,42.1l5.5,3.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l4.6-3.8a.8.8,0,0,0,.4-.7V19.4h0A.8.8,0,0,0,45.6,18.7Zm-5.1,6.8H42v1.6l-3.5,2.8-.4.3-.4-.2a1.4,1.4,0,0,0-2,.7,1.5,1.5,0,0,0,.6,2l.7.3h0v5.4l-6.6,3.1-4.2-2.8-.7-.5V25.5H27a1.5,1.5,0,0,0,0-3H25.5V9.7l.7-.5,4.2-2.8L37,9.5v5.4h0l-.7.3a1.5,1.5,0,0,0-.6,2,1.4,1.4,0,0,0,1.3.9l.7-.2.4-.2.4.3L42,20.9v1.6H40.5a1.5,1.5,0,0,0,0,3Z" />
                            <path d="M13.9,9.9a1.8,1.8,0,0,0,0,2.2l2.6,2.5v2.8l-4,4v5.2l4,4v2.8l-2.6,2.5a1.8,1.8,0,0,0,0,2.2,1.5,1.5,0,0,0,1.1.4,1.5,1.5,0,0,0,1.1-.4l3.4-3.5V29.4l-4-4V22.6l4-4V13.4L16.1,9.9A1.8,1.8,0,0,0,13.9,9.9Z" />
                            <path d="M31.5,14.6l2.6-2.5a1.8,1.8,0,0,0,0-2.2,1.8,1.8,0,0,0-2.2,0l-3.4,3.5v5.2l4,4v2.8l-4,4v5.2l3.4,3.5a1.7,1.7,0,0,0,2.2,0,1.8,1.8,0,0,0,0-2.2l-2.6-2.5V30.6l4-4V21.4l-4-4Z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-wide">OpenAI-Compatible Endpoint Tester</p>
                        <p className="text-[#76D2DB]/60 text-[10px] font-mono mt-0.5">Sends a minimal 5-token probe · Low cost · Fast feedback</p>
                    </div>
                    <div className="ml-auto hidden md:flex gap-1.5 items-center opacity-70">
                        {['#76D2DB', '#F7F6E5', '#DA4848'].map(c => (
                            <span key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">

                {/* Left Column: Configuration */}
                <div className="space-y-4">
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#76D2DB]/80 via-[#DA4848]/40 to-transparent" />

                        <div className="px-5 py-4 border-b border-[#76D2DB]/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-sm bg-[#76D2DB] shadow-[0_0_8px_#76D2DB]" />
                                <span className="text-[10px] font-black text-[#76D2DB] uppercase tracking-[0.2em]">
                                    {isConfigured ? 'Configuration' : 'Setup Required'}
                                </span>
                            </div>
                            {isConfigured && !editing && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 rounded transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-[#DA4848]/30 text-[#DA4848]/60 hover:text-[#DA4848] hover:border-[#DA4848]/60 rounded transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Reset
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 space-y-6">
                            {isConfigured && !editing ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg border border-[#76D2DB]/10 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#76D2DB] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Endpoint Settings
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Base URL</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-[10px] font-mono text-[#76D2DB] bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded px-2.5 py-1.5 truncate">{baseUrl}</code>
                                                    <CopyBtn value={baseUrl} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Model</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-[10px] font-mono text-[#76D2DB] bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded px-2.5 py-1.5">{model}</code>
                                                    <CopyBtn value={model} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border border-[#DA4848]/10 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#DA4848] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            API Credentials
                                        </h4>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-[10px] font-mono text-[#DA4848]/80 bg-[#DA4848]/5 border border-[#DA4848]/10 rounded px-2.5 py-1.5">
                                                    {user ? apiKeyMasked : (showKey ? apiKey : apiKeyMasked)}
                                                </code>
                                                <div className="flex gap-1">
                                                    {!user && (
                                                        <button onClick={() => setShowKey(v => !v)} className="p-1.5 text-slate-600 hover:text-[#76D2DB]">
                                                            {showKey ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                                        </button>
                                                    )}
                                                    {user ? <ApiKeyCopyBtn /> : <CopyBtn value={apiKey} />}
                                                </div>
                                            </div>
                                            {user && <p className="text-[8px] text-[#DA4848]/50 font-mono mt-2 italic">Encrypted & masked in database</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Provider Dropdown (as selection list) */}
                                    <div className="p-4 rounded-lg bg-[#76D2DB]/3 border border-[#76D2DB]/10">
                                        <label className="text-[9px] font-black text-[#76D2DB]/70 uppercase tracking-[0.2em] block mb-3">Quick Sync Provider</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PROVIDERS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectProvider(p)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded border border-white/5 bg-black/40 hover:border-[#76D2DB]/40 hover:bg-[#76D2DB]/5 transition-all group/p"
                                                >
                                                    <div className="shrink-0 text-[#76D2DB]/60 group-hover/p:text-[#76D2DB]">{p.icon}</div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover/p:text-slate-300">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 1: Configuration */}
                                    <div className="p-4 rounded-lg border border-[#76D2DB]/20 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#76D2DB] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                            Endpoint Data
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-1.5">Base URL</label>
                                                <input
                                                    type="url"
                                                    value={baseUrl}
                                                    onChange={e => setBaseUrl(e.target.value)}
                                                    placeholder="https://api.openai.com"
                                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-xs text-white placeholder-gray-700 font-mono focus:border-[#76D2DB]/60 transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-1.5">Model ID</label>
                                                <input
                                                    type="text"
                                                    value={model}
                                                    onChange={e => setModel(e.target.value)}
                                                    placeholder="gpt-4o, etc."
                                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 text-xs text-white placeholder-gray-700 font-mono focus:border-[#76D2DB]/60 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Security */}
                                    <div className="p-4 rounded-lg border border-[#DA4848]/20 bg-black/20">
                                        <h4 className="text-[9px] font-black text-[#DA4848] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            API Access
                                        </h4>
                                        <div className="relative">
                                            <input
                                                type={showKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={e => setApiKey(e.target.value)}
                                                placeholder={isConfigured ? '(unchanged)' : 'sk-••••••••'}
                                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2.5 pr-10 text-xs text-white placeholder-gray-700 font-mono focus:border-[#DA4848]/60 transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 hover:text-[#76D2DB] transition-colors"
                                            >
                                                {showKey ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-slate-600 mt-2 italic font-mono">Leave blank to keep current key</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#76D2DB]/10 border border-[#76D2DB]/40 text-[#76D2DB] hover:bg-[#76D2DB]/20 hover:border-[#76D2DB]/70 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(118,210,219,0.1)]"
                                        >
                                            {saveStatus === 'saving' ? (
                                                <span className="w-3 h-3 rounded-full border border-[#76D2DB]/40 border-t-[#76D2DB] animate-spin" />
                                            ) : saveStatus === 'saved' ? (
                                                <span className="flex items-center gap-2">✓ SAVED!</span>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    Save Configuration
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setEditing(false); setApiKey(''); setShowKey(false); }}
                                            className="px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest border border-gray-700 text-slate-500 hover:text-slate-300 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {!user && (
                        <div className="rounded-xl border border-[#DA4848]/20 bg-[#DA4848]/5 px-4 py-3 flex items-start gap-3">
                            <svg className="w-4 h-4 text-[#DA4848] shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <p className="text-[9px] text-slate-500">Guest mode – Local storage only. <a href="/login" className="text-[#76D2DB] hover:underline">Sign in</a> to sync.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Test Results */}
                <div className="space-y-4">
                    <div className="relative rounded-xl border border-[#76D2DB]/20 bg-[#0B0F1A] overflow-hidden shadow-lg p-6 flex flex-col items-center gap-6">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#DA4848]/60" />
                        {!isConfigured ? (
                            <div className="text-center py-6 opacity-40">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl border-2 border-dashed border-[#76D2DB]/20 flex items-center justify-center text-[#76D2DB]/50">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-widest">Awaiting Setup</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 text-center max-w-xs">Fire a test request to verify your endpoint and API credentials.</p>
                                <button
                                    onClick={handleTest}
                                    disabled={testing}
                                    className="w-full max-w-xs flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-linear-to-br from-[#76D2DB]/15 to-[#DA4848]/10 border border-[#76D2DB]/40 text-[#76D2DB] hover:border-[#76D2DB] hover:bg-[#76D2DB]/20 disabled:opacity-50"
                                >
                                    {testing ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" /> : 'Fire Test Request'}
                                </button>
                            </>
                        )}
                    </div>

                    {result && (
                        <div className="relative rounded-xl border border-white/5 bg-[#0B0F1A] overflow-hidden shadow-2xl">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: result.success ? '#76D2DB' : '#DA4848' }} />
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: result.success ? '#76D2DB' : '#DA4848' }}>
                                    {result.success ? '✓ Diagnostic Success' : '✗ Diagnostic Error'}
                                </span>
                                {result.statusCode > 0 && <StatusPill code={result.statusCode} />}
                            </div>

                            <div className="px-5 py-5 space-y-5">
                                {result.success ? (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-2">Stream Content</label>
                                            <div className="relative">
                                                <div className="bg-[#76D2DB]/5 border border-[#76D2DB]/10 rounded-lg px-4 py-3.5 font-mono text-sm text-white break-all">{result.content || <span className="opacity-30">EMPTY_BODY</span>}</div>
                                                <div className="absolute top-2 right-2"><CopyBtn value={result.content || ''} /></div>
                                            </div>
                                        </div>
                                        {result.usage && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Prompt', val: result.usage.prompt_tokens },
                                                    { label: 'Completion', val: result.usage.completion_tokens },
                                                    { label: 'Total', val: result.usage.total_tokens },
                                                ].map(({ label, val }) => (
                                                    <div key={label} className="rounded bg-white/5 border border-white/5 p-3 text-center">
                                                        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">{label}</div>
                                                        <div className="text-sm font-black font-mono text-[#76D2DB]">{val ?? '0'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <label className="text-[9px] font-black text-[#DA4848]/70 uppercase tracking-[0.2em] block mb-2">Error Trace</label>
                                        <div className="bg-[#DA4848]/5 border border-[#DA4848]/20 rounded-lg px-4 py-3.5 font-mono text-xs text-[#DA4848] break-all">{result.error || 'UNHANDLED_EXCEPTION'}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
