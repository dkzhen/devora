'use client';

import { Mail, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const THEME = {
    bg: 'from-[#0a0e1a] to-[#07090f]',
    border: 'border-cyan-500/20',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
    accentLine: 'via-cyan-500/60',
    bracketStrong: 'border-cyan-500/50',
    bracketWeak: 'border-cyan-500/15',
    headerIcon: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
    headerBorder: 'border-cyan-500/10',
    subtext: 'text-cyan-400/70',
    linkBtn: 'border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
};

export default function TempMailActivityCard({ recentEmails = [] }) {

    const maskEmail = (email) => {
        if (!email) return '';
        const [username, domain] = email.split('@');
        if (!username || !domain) return email;
        
        // Show first 2 chars + *** + last char of username
        if (username.length <= 3) {
            return `${username[0]}***@${domain}`;
        }
        return `${username.substring(0, 2)}***${username[username.length - 1]}@${domain}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getProviderColor = (address) => {
        if (address.includes('zenra.my.id') || address.includes('moemail')) {
            return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', name: 'MoeMail' };
        }
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', name: 'Mail.tm' };
    };

    return (
        <div className={`relative overflow-hidden rounded-lg bg-linear-to-b ${THEME.bg} border ${THEME.border} p-6 flex flex-col h-full group ${THEME.glow}`}>
            {/* Top neon accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent ${THEME.accentLine} to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
            
            {/* Corner brackets */}
            <span className={`absolute top-2 left-2 w-3.5 h-3.5 border-t border-l ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute top-2 right-2 w-3.5 h-3.5 border-t border-r ${THEME.bracketStrong} pointer-events-none`} />
            <span className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${THEME.bracketWeak} pointer-events-none`} />
            <span className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${THEME.bracketWeak} pointer-events-none`} />

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Header */}
            <div className={`relative z-10 flex items-center justify-between mb-6 border-b ${THEME.headerBorder} pb-4`}>
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${THEME.headerIcon}`}>
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Recent Activity</h3>
                        <p className={`text-[10px] font-bold ${THEME.subtext} uppercase tracking-widest mt-0.5`}>Latest Generated Emails</p>
                    </div>
                </div>
                <Link href="/temp-mail" className={`p-1.5 rounded-md border ${THEME.linkBtn}`} title="View Temp Mail">
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {recentEmails.length > 0 ? (
                    recentEmails.map((email, index) => {
                        const provider = getProviderColor(email.address);
                        return (
                            <div
                                key={email.id || index}
                                className="p-3 rounded-lg border border-cyan-500/10 bg-[#0a0e1a]/60 hover:border-cyan-500/30 hover:bg-[#0a0e1a]/80 transition-all group/item"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg ${provider.bg} border ${provider.border} flex items-center justify-center shrink-0`}>
                                        <Mail className={`w-5 h-5 ${provider.text}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-mono text-white truncate font-bold">
                                                {maskEmail(email.address)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className={`px-1.5 py-0.5 rounded ${provider.bg} ${provider.text} border ${provider.border} font-bold`}>
                                                {provider.name}
                                            </span>
                                            <span className="text-slate-500">•</span>
                                            <span className="text-slate-500">
                                                {formatDate(email.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status indicator */}
                                    <div className="shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-3">
                            <Mail className="w-6 h-6 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">No recent activity</p>
                        <p className="text-xs text-slate-600 mt-1">Generate emails to see activity</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`relative z-10 mt-4 pt-4 border-t ${THEME.headerBorder} flex items-center justify-between text-[10px] uppercase font-bold tracking-widest ${THEME.subtext} opacity-80`}>
                <span>Last 5 Generated</span>
                <span className="text-cyan-500">Live Updates</span>
            </div>
        </div>
    );
}
