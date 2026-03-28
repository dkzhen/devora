"use client";
import { useState, useCallback, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
    Globe,
    Star,
    Phone,
    MessageSquare,
    DollarSign,
    Clock,
    Mail,
    Smartphone,
    Zap,
    Trash2,
    RefreshCw,
    Edit3,
    Shield,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBalance(raw) {
    if (!raw) return "Rp 0";
    const n = parseInt(String(raw).replace(/\D/g, ""), 10);
    if (isNaN(n)) return raw;
    return "Rp " + n.toLocaleString("id-ID");
}
function formatDate(raw) {
    if (!raw) return "-";
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Mock Data (preview only) ─────────────────────────────────────────────────
const MOCK_PROFILE = {
    name: "Dani Kurniawan",
    accountStatus: "Active",
    email: "dani.kurniawan@gmail.com",
    loyaltyTier: "Silver",
    loyaltyPoints: "345",
    balance: "505",
    expiryDate: "2026-03-25",
};
const MOCK_QUOTA = [
    { class: "DATA", total: "0 GB", items: [] },
    {
        class: "ENTERTAINMENT",
        total: "8 GB",
        items: [
            {
                name: "Paket Multimedia 8GB",
                remaining: "8 GB",
                expiry: "25 Mar 2026",
            },
        ],
    },
    { class: "VOICE", total: "0 Min", items: [] },
    { class: "SMS", total: "0 SMS", items: [] },
    { class: "MONETARY", total: "Rp0", items: [] },
];
const MOCK_CONFIG = {
    webMsisdn: "6281227362553",
    savedAt: "2026-03-10T00:00:00Z",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ConfigForm = ({ form, setForm, onSave, onCancel, saving, fields }) => (
    <div className="max-w-4xl mx-auto w-full">
        <div className="relative bg-[#070c17] border border-red-500/20 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.06),0_0_1px_rgba(239,68,68,0.2)]">
            {/* Top neon line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-500/60 to-transparent pointer-events-none" />
            {/* Corner brackets */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-red-500/50 pointer-events-none" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-red-500/50 pointer-events-none" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-red-500/20 pointer-events-none" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-red-500/20 pointer-events-none" />

            {/* Form Header */}
            <div className="bg-linear-to-r from-[#100808] via-[#0a0808] to-[#080812] p-5 border-b border-red-500/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/15 border border-red-500/25 rounded shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.18)]">
                        <Shield className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-widest uppercase">
                            Token Configuration
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                            Open DevTools → Network at{" "}
                            <span className="text-red-400/80">my.telkomsel.com</span>, copy
                            these 6 headers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    {fields.map((f) => (
                        <div key={f.key} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-500/70" />
                                    {f.label}
                                </label>
                                <span className="text-[9px] text-gray-600 italic truncate max-w-[130px]">
                                    {f.hint}
                                </span>
                            </div>
                            <textarea
                                rows={
                                    ["authorization", "accessAuth", "xDevice"].includes(f.key)
                                        ? 3
                                        : 2
                                }
                                value={form[f.key]}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                placeholder={f.placeholder}
                                className="w-full bg-[#040811] border border-[#171f30] focus:border-red-500/30 focus:bg-[#060d1a] rounded px-4 py-2.5 text-[11px] text-gray-300 placeholder-gray-800 outline-none font-mono resize-none leading-relaxed"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-7 pt-5 border-t border-[#171f30]">
                    <div className="flex-1 text-[10px] text-gray-500 flex items-start gap-2.5 bg-red-500/4 p-3.5 rounded border border-red-500/10">
                        <Shield className="w-3.5 h-3.5 text-red-500/60 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                            Token is stored with{" "}
                            <strong className="text-gray-400">AES-256-CBC</strong> encryption. Only
                            you can access it.
                        </span>
                    </div>
                    <div className="flex gap-3 shrink-0 items-center">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-5 py-2.5 text-gray-500 hover:text-white rounded border border-[#171f30] hover:border-white/10 text-[10px] font-bold uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="px-7 py-2.5 bg-linear-to-r from-red-600 to-rose-600 disabled:opacity-40 text-white rounded font-black text-[10px] uppercase tracking-[0.18em] flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                            data-testid="save-config-btn"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            {saving ? "Saving..." : "Save & Connect"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

function TierBadge({ tier }) {
    const map = {
        Gold: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30",
        Silver: "from-gray-400/15 to-slate-400/15 text-gray-300 border-gray-400/30",
        Diamond: "from-cyan-400/20 to-blue-400/20 text-cyan-300 border-cyan-400/30",
        Platinum:
            "from-purple-400/20 to-pink-400/20 text-purple-300 border-purple-400/30",
    };
    const cls = map[tier] || "bg-white/10 text-gray-300 border-white/20";
    return (
        <span
            className={`inline-flex items-center px-3 py-1 bg-linear-to-r rounded-sm border text-[9px] font-black uppercase tracking-[0.2em] ${cls}`}
        >
            {tier || "Member"}
        </span>
    );
}

function StatusBadge({ status }) {
    const active = /active|aktiv/i.test(status || "");
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[9px] font-black uppercase tracking-[0.18em] ${active
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                : "bg-red-500/10 text-red-400 border-red-500/25"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-red-400"}`}
            />
            {status || "Unknown"}
        </span>
    );
}

// ─── Field Config ─────────────────────────────────────────────────────────────
const FIELDS = [
    {
        key: "xDevice",
        label: "x-device",
        placeholder: "0fb8db64-e65b-4375-9e66-4c91a0cc4657",
        hint: "Header x-device from DevTools",
    },
    {
        key: "authorization",
        label: "Authorization",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        hint: 'Bearer token (without "Bearer ")',
    },
    {
        key: "accessAuth",
        label: "AccessAuthorization",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        hint: 'accessauthorization (without "Bearer ")',
    },
    {
        key: "webMsisdn",
        label: "web-msisdn",
        placeholder: "6281227362553",
        hint: "MSISDN number 628xxxxxxxxx",
    },
    {
        key: "hash",
        label: "HASH",
        placeholder: "56d3b378-4375-4375-9e66-4c91a0cc4657",
        hint: "Header HASH value",
    },
    {
        key: "transactionId",
        label: "TRANSACTIONID",
        placeholder: "A30226031020203917411",
        hint: "Header TRANSACTIONID value",
    },
];
const EMPTY_FORM = () => FIELDS.reduce((a, f) => ({ ...a, [f.key]: "" }), {});

const QUOTA_ICONS = {
    DATA: Globe,
    ENTERTAINMENT: Star,
    VOICE: Phone,
    SMS: MessageSquare,
    MONETARY: DollarSign,
};
const QUOTA_TABS = [
    { key: "DATA", label: "Internet" },
    { key: "ENTERTAINMENT", label: "Multimedia" },
    { key: "VOICE", label: "Voice" },
    { key: "SMS", label: "SMS" },
    { key: "MONETARY", label: "Monetary" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
import { HeroHeader, LoadingState } from "@/components/HeroHeader";

export default function TelkomselClientPage() {
    // Note: previewMode is explicitly removed so it always uses the real data from DB/API.
    const [state, setState] = useState("loading");
    const [form, setForm] = useState(EMPTY_FORM());
    const [saving, setSaving] = useState(false);
    const [configInfo, setConfigInfo] = useState(null);
    const [profile, setProfile] = useState(null);
    const [quota, setQuota] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingQuota, setLoadingQuota] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [activeQuotaTab, setActiveQuotaTab] = useState("DATA");
    const [offersInternet, setOffersInternet] = useState(null);
    const [offersVoiceSms, setOffersVoiceSms] = useState(null);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [offerCategory, setOfferCategory] = useState("internet");
    const [activeOfferTab, setActiveOfferTab] = useState(0);
    const [showPackages, setShowPackages] = useState(true);

    const checkConfig = useCallback(async () => {
        try {
            const res = await fetch("/api/telkomsel-client/config", { cache: "no-store" });
            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }
            const data = await res.json();
            if (data.config) {
                setConfigInfo(data.config);
                setState("dashboard");
            } else setState("config");
        } catch {
            setState("config");
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const res = await fetch("/api/telkomsel-client/profile", { cache: "no-store" });
            const data = await res.json();
            if (res.ok) setProfile(data);
            else toast.error(data.error || "Failed to load profile");
        } catch {
            toast.error("Network error");
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    const fetchQuota = useCallback(async () => {
        setLoadingQuota(true);
        try {
            const res = await fetch("/api/telkomsel-client/quota", { cache: "no-store" });
            const data = await res.json();
            if (res.ok) setQuota(data.groups || []);
            else toast.error(data.error || "Failed to load quota");
        } catch {
            toast.error("Network error");
        } finally {
            setLoadingQuota(false);
        }
    }, []);

    const fetchOffers = useCallback(async (type = "internet") => {
        setLoadingOffers(true);
        try {
            const res = await fetch(`/api/telkomsel-client/offers?type=${type}`, { cache: "no-store" });
            const data = await res.json();
            if (res.ok) {
                const group = data.offerGroup || [];
                if (type === "voice_sms") setOffersVoiceSms(group);
                else setOffersInternet(group);
                setActiveOfferTab(0);
            } else {
                toast.error(data.error || "Failed to load offers");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoadingOffers(false);
        }
    }, []);

    useEffect(() => {
        checkConfig();
    }, [checkConfig]);

    useEffect(() => {
        if (state === "dashboard" && configInfo) {
            fetchProfile();
            fetchQuota();
            fetchOffers("internet");
            fetchOffers("voice_sms");
        }
    }, [state, configInfo, fetchProfile, fetchQuota, fetchOffers]);

    const handleSave = async () => {
        const missing = FIELDS.filter((f) => !form[f.key]?.trim());
        if (missing.length > 0) {
            toast.error(`Please complete: ${missing.map((f) => f.label).join(", ")}`);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/telkomsel-client/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Configuration saved!");
                setShowEdit(false);
                setForm(EMPTY_FORM());
                await checkConfig();
                if (state === "dashboard") {
                    fetchProfile();
                    fetchQuota();
                }
            } else if (res.status === 401) {
                toast.error("Session expired. Please log in again.");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1500);
            } else {
                toast.error(data.error || "Failed to save");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete Telkomsel configuration?")) return;
        await fetch("/api/telkomsel-client/session", { method: "DELETE" });
        setProfile(null);
        setQuota(null);
        setConfigInfo(null);
        setForm(EMPTY_FORM());
        setState("config");
        toast.success("Configuration deleted");
    };


    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <>

            <Toaster theme="dark" position="top-right" />
            <style>{`
                .offer-desc-html ul, .offer-desc-html ol {
                    padding-left: 0.875rem !important;
                    margin-bottom: 0.75rem !important;
                    list-style-type: disc !important;
                }
                .offer-desc-html ol {
                    list-style-type: decimal !important;
                }
                .offer-desc-html li {
                    margin-bottom: 0.4rem !important;
                    color: #94a3b8 !important;
                    font-size: 10px !important;
                }
                .offer-desc-html strong, .offer-desc-html b {
                    color: #ef4444 !important;
                    font-weight: 900 !important;
                }
            `}</style>
            <div
                className="flex flex-col gap-5 min-h-screen text-white overflow-x-hidden"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(239,68,68,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(239,68,68,0.025) 1px, transparent 1px)
                    `,
                    backgroundSize: "28px 28px",
                }}
            >
                {/* ── HERO HEADER ─────────────────────────────────────────────── */}
                <HeroHeader
                    colorTheme="red"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/" },
                        { label: "Telkomsel Client" }
                    ]}
                    title="Telkomsel"
                    badge="Client"
                    description="Enter token from DevTools to check profile, balance, and quotas in real-time."
                />

                {/* Loading state */}
                {state === "loading" && <LoadingState message="Loading..." colorTheme="red" />}

                {/* Config Form */}
                {state === "config" && (
                    <ConfigForm
                        form={form}
                        setForm={setForm}
                        onSave={handleSave}
                        saving={saving}
                        fields={FIELDS}
                    />
                )}
                {state === "dashboard" && showEdit && (
                    <ConfigForm
                        form={form}
                        setForm={setForm}
                        onSave={handleSave}
                        onCancel={() => setShowEdit(false)}
                        saving={saving}
                        fields={FIELDS}
                    />
                )}

                {/* ── DASHBOARD ──────────────────────────────────────────────── */}
                {state === "dashboard" && !showEdit && (
                    <div className="flex flex-col gap-6 w-full pb-20">
                        {/* ── SECTION 1: Profile / Quota Cards ─────────────────── */}
                        <div className="w-full overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* ── PROFILE CARD ─────────────────────────────────── */}
                                <div className="lg:col-span-4 xl:col-span-3">
                                    <div className="relative bg-linear-to-b from-[#0a0e1a] to-[#07090f] border border-red-500/[0.13] rounded-lg p-5 flex flex-col gap-4 overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05),0_0_1px_rgba(239,68,68,0.18)]">
                                        {/* Top neon accent */}
                                        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-500/50 to-transparent pointer-events-none" />
                                        {/* Corner brackets */}
                                        <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-red-500/40 pointer-events-none" />
                                        <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-red-500/40 pointer-events-none" />
                                        <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-red-500/15 pointer-events-none" />
                                        <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-red-500/15 pointer-events-none" />
                                        {/* Glow */}
                                        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

                                        {/* Section label row */}
                                        <div className="relative z-10 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                                <span className="w-4 h-px bg-linear-to-r from-red-500/50 to-transparent" />
                                                Profile
                                            </span>
                                            <button
                                                onClick={fetchProfile}
                                                data-testid="refresh-profile-btn"
                                                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${loadingProfile ? "animate-spin" : ""}`} />
                                            </button>
                                        </div>

                                        {loadingProfile && !profile ? (
                                            <div className="relative z-10 text-[10px] text-gray-600 font-mono uppercase tracking-widest text-center py-6">
                                                Loading data...
                                            </div>
                                        ) : profile ? (
                                            <div className="relative z-10 space-y-4">
                                                {/* Avatar + Name */}
                                                <div className="flex items-center gap-3.5">
                                                    <div className="relative shrink-0">
                                                        <div className="absolute inset-0 rounded-xl bg-red-500/15 blur-lg pointer-events-none" />
                                                        <div className="relative w-12 h-12 rounded-xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center text-lg font-black text-white border border-red-500/30 shadow-[0_0_16px_rgba(239,68,68,0.3)]">
                                                            {profile.name?.charAt(0)?.toUpperCase() || "?"}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                        <div className="font-black text-white text-sm truncate tracking-tight">
                                                            {profile.name || "-"}
                                                        </div>
                                                        <StatusBadge status={profile.accountStatus} />
                                                    </div>
                                                </div>

                                                {/* Contact info */}
                                                <div className="space-y-2 pt-3 border-t border-white/[0.05]">
                                                    {profile.email && (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/15">
                                                                <Mail className="w-3 h-3 text-blue-400" />
                                                            </div>
                                                            <span className="text-gray-400 truncate text-[10px] font-medium">
                                                                {profile.email}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-1.5 rounded bg-red-500/10 border border-red-500/15">
                                                            <Smartphone className="w-3 h-3 text-red-400" />
                                                        </div>
                                                        <span className="text-gray-300 font-mono text-[11px] font-bold tracking-wide">
                                                            {configInfo?.webMsisdn || "-"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Balance & Expiry (Merged) */}
                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <div className="p-2.5 rounded bg-red-500/3 border border-red-500/10">
                                                        <div className="text-[8px] text-gray-500 mb-1 font-black uppercase tracking-wider">BALANCE</div>
                                                        <div className="text-sm font-black text-white">{formatBalance(profile.balance)}</div>
                                                    </div>
                                                    <div className="p-2.5 rounded bg-amber-500/3 border border-amber-500/10">
                                                        <div className="text-[8px] text-gray-500 mb-1 font-black uppercase tracking-wider">EXPIRY DATE</div>
                                                        <div className="text-[10px] font-black text-amber-500">{profile.expiryDate ? formatDate(profile.expiryDate) : "-"}</div>
                                                    </div>
                                                </div>

                                                {/* Membership */}
                                                {profile.loyaltyTier && (
                                                    <div className="flex items-center justify-between gap-2 p-3 rounded bg-white/5 border border-white/[0.07]">
                                                        <TierBadge tier={profile.loyaltyTier} />
                                                        {profile.loyaltyPoints && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                                                                <Star className="w-3 h-3 text-amber-400" />
                                                                <span className="text-xs font-black text-amber-400">
                                                                    {parseInt(profile.loyaltyPoints).toLocaleString(
                                                                        "id-ID",
                                                                    )}
                                                                </span>
                                                                <span className="text-[9px] text-amber-400/60 font-bold">
                                                                    pts
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="relative z-10 text-[11px] text-gray-600 text-center py-4">
                                                Failed to load profile
                                            </p>
                                        )}

                                        {configInfo && (
                                            <>
                                                <div className="relative z-10 pt-3 border-t border-white/[0.05] text-[9px] text-gray-600 flex items-center gap-1.5 font-mono">
                                                    <Clock className="w-3 h-3" />
                                                    Token saved: {formatDate(configInfo.savedAt)}
                                                </div>
                                                <div className="relative z-10 flex items-center gap-3 pt-2">
                                                    <span
                                                        data-testid="token-active-badge"
                                                        className="px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-md text-[9px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.05)]"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                                        Token Active
                                                    </span>
                                                    <button
                                                        onClick={() => setShowEdit(!showEdit)}
                                                        data-testid="update-token-btn"
                                                        className="px-3 py-1.5 bg-white/[0.02] border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 rounded-md text-[9px] font-bold text-gray-400 hover:text-red-400 flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(255,255,255,0.02)] active:scale-95"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                        Update Token
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        <button
                                            onClick={handleDelete}
                                            data-testid="delete-token-btn"
                                            className="relative z-10 mt-auto flex items-center justify-center gap-1.5 py-2.5 text-[10px] text-gray-600 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 rounded font-bold"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete Token
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                        Member id: <span className="font-mono text-gray-400">{profile?.acc_id || "-"}</span>
                                    </p>
                                </div>

                                {/* ── BALANCE & QUOTA ──────────────────────────────── */}
                                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                                    <div className="flex flex-col gap-5">
                                        {/* Quota Card */}
                                        <div className="relative bg-linear-to-b from-[#0a0e1a] to-[#07090f] border border-cyan-500/[0.1] rounded-lg overflow-hidden flex-1 flex flex-col shadow-[0_0_25px_rgba(6,182,212,0.03),0_0_1px_rgba(6,182,212,0.12)]">
                                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />
                                            <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-cyan-500/25 pointer-events-none" />
                                            <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-cyan-500/25 pointer-events-none" />
                                            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/[0.025] blur-3xl pointer-events-none" />

                                            {/* Quota Header */}
                                            <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                                    <span className="w-4 h-px bg-linear-to-r from-cyan-500/50 to-transparent" />
                                                    Quota Details
                                                </span>
                                                <button
                                                    onClick={fetchQuota}
                                                    data-testid="refresh-quota-btn"
                                                    className="p-1.5 text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded border border-transparent hover:border-cyan-500/20"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? "animate-spin" : ""}`} />
                                                </button>
                                            </div>

                                            {loadingQuota && !quota ? (
                                                <div className="px-5 pb-5 text-[10px] text-gray-600 font-mono uppercase tracking-widest text-center py-6">
                                                    Loading quota...
                                                </div>
                                            ) : quota ? (
                                                <div className="flex flex-col flex-1">
                                                    {/* Tabs */}
                                                    <div className="px-5 pb-4">
                                                        <div className="flex bg-[#040811] rounded-lg p-1 border border-white/[0.05] gap-0.5">
                                                            {QUOTA_TABS.map((tab) => {
                                                                const isActive = activeQuotaTab === tab.key;
                                                                const Icon = QUOTA_ICONS[tab.key];
                                                                const groupData = quota?.find(
                                                                    (g) => g.class === tab.key,
                                                                );
                                                                const total = groupData?.total;
                                                                return (
                                                                    <button
                                                                        key={tab.key}
                                                                        onClick={() => setActiveQuotaTab(tab.key)}
                                                                        data-testid={`quota-tab-${tab.key.toLowerCase()}`}
                                                                        className={`flex-1 min-w-0 py-2.5 px-1.5 flex flex-col items-center justify-center rounded relative overflow-hidden ${isActive
                                                                            ? "bg-linear-to-b from-red-600/85 to-rose-700/85 text-white border border-red-500/30 shadow-[0_0_14px_rgba(239,68,68,0.2)]"
                                                                            : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                                                                            }`}
                                                                    >
                                                                        <Icon className="w-3.5 h-3.5 mb-1 relative z-10" />
                                                                        <span className="text-[9px] font-black whitespace-nowrap relative z-10 tracking-wider">
                                                                            {tab.label}
                                                                        </span>
                                                                        {total && (
                                                                            <span
                                                                                className={`text-[8px] mt-1 px-1.5 py-px font-black rounded-sm relative z-10 ${isActive
                                                                                    ? "bg-white/20 text-white"
                                                                                    : "bg-white/5 text-gray-600"
                                                                                    }`}
                                                                            >
                                                                                {total}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Tab Content */}
                                                    <div className="px-5 pb-5 flex-1">
                                                        {(() => {
                                                            const activeGroupData = quota?.find(
                                                                (g) => g.class === activeQuotaTab,
                                                            );
                                                            const items = activeGroupData?.items || [];
                                                            if (items.length > 0) {
                                                                return (
                                                                    <div className="space-y-2.5">
                                                                        {items.map((item, ii) => (
                                                                            <div
                                                                                key={ii}
                                                                                data-testid={`quota-item-${ii}`}
                                                                                className="relative bg-[#040811] border border-white/[0.05] rounded-lg p-4 flex items-center justify-between gap-4 hover:border-red-500/15 overflow-hidden"
                                                                            >
                                                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-red-500/50 to-transparent pointer-events-none" />
                                                                                <div className="flex-1 min-w-0 pl-2">
                                                                                    <div className="text-[11px] font-bold text-gray-200 truncate mb-1">
                                                                                        {item.name}
                                                                                    </div>
                                                                                    {item.expiry && (
                                                                                        <div className="text-[9px] text-gray-600 flex items-center gap-1">
                                                                                            <Clock className="w-2.5 h-2.5" />
                                                                                            Expires on {item.expiry}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-sm font-black text-red-400 shrink-0 bg-red-500/10 px-3.5 py-2 rounded border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] font-mono">
                                                                                    {item.remaining || "0"}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            } else {
                                                                const Icon = QUOTA_ICONS[activeQuotaTab];
                                                                return (
                                                                    <div className="py-10 flex flex-col items-center justify-center text-center">
                                                                        <div className="w-14 h-14 rounded-xl bg-[#040811] border border-white/[0.06] flex items-center justify-center text-gray-700 mb-3.5">
                                                                            <Icon className="w-7 h-7" />
                                                                        </div>
                                                                        <p className="text-gray-500 text-[11px] font-bold mb-1.5">
                                                                            No active packages
                                                                        </p>
                                                                        <p className="text-gray-700 text-[10px] max-w-xs leading-relaxed">
                                                                            Kamu belum memiliki paket{" "}
                                                                            {QUOTA_TABS.find(
                                                                                (t) => t.key === activeQuotaTab,
                                                                            )?.label?.toLowerCase()}{" "}
                                                                            saat ini.
                                                                        </p>
                                                                        {activeGroupData?.total && (
                                                                            <div className="mt-4 px-4 py-2 bg-white/[0.025] rounded border border-white/[0.07] text-gray-500 text-[10px] font-bold flex items-center gap-2">
                                                                                Total:{" "}
                                                                                <span className="text-white text-xs font-black">
                                                                                    {activeGroupData.total}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-gray-600 text-center py-8">
                                                    Failed to load quota
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── SECTION 2: Penawaran Paket ─────────────────────── */}
                        <div className="relative w-full bg-[#0a0e1a]/80 backdrop-blur-xl border border-red-500/20 rounded-lg overflow-hidden flex flex-col shadow-[0_0_40px_rgba(239,68,68,0.05)]">
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
                            <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-red-500/40 pointer-events-none" />
                            <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-red-500/40 pointer-events-none" />

                            {/* Section Header inside container */}
                            <div className="flex flex-col md:flex-row md:items-center gap-4 px-5 pt-5 pb-2">
                                <div>
                                    <div className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                        Flash Deals &amp; Specials
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Package Offers</h3>
                                </div>

                                {/* Category Switcher */}
                                <div className="flex bg-[#040811] rounded p-1 border border-white/[0.05] gap-1 md:ml-6">
                                    <button
                                        onClick={() => setOfferCategory("internet")}
                                        className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${offerCategory === "internet"
                                            ? "bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            : "text-gray-500 hover:text-gray-300"
                                            }`}
                                    >
                                        Internet
                                    </button>
                                    <button
                                        onClick={() => setOfferCategory("voice_sms")}
                                        className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${offerCategory === "voice_sms"
                                            ? "bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            : "text-gray-500 hover:text-gray-300"
                                            }`}
                                    >
                                        Voice &amp; SMS
                                    </button>
                                </div>

                                <button
                                    onClick={() => fetchOffers(offerCategory)}
                                    disabled={loadingOffers}
                                    className="ml-auto p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md border border-white/5 hover:border-red-500/20 transition-all active:scale-90"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loadingOffers ? "animate-spin" : ""}`} />
                                </button>
                            </div>

                            {(() => {
                                const currentOffers = offerCategory === "voice_sms" ? offersVoiceSms : offersInternet;
                                if (loadingOffers && !currentOffers) {
                                    return (
                                        <div className="px-6 py-12 flex flex-col items-center justify-center gap-4">
                                            <RefreshCw className="w-6 h-6 text-red-500/40 animate-spin" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Scanning for {offerCategory === "voice_sms" ? "voice & sms" : "internet"} offers...
                                            </span>
                                        </div>
                                    );
                                }
                                if (currentOffers && currentOffers.length > 0) {
                                    return (
                                        <div className="flex flex-col">
                                            {/* Categories Tabs (Offer Groups) */}
                                            <div className="mb-6 mt-4 overflow-x-auto scrollbar-none border-b border-white/[0.03]">
                                                <div className="flex gap-2 px-5 pb-2 w-max">
                                                    {currentOffers.map((group, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveOfferTab(idx)}
                                                            className={`shrink-0 px-5 py-2 rounded-sm border text-[10px] font-black uppercase tracking-widest transition-all ${activeOfferTab === idx
                                                                ? "bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                                                : "bg-white/5 text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300"
                                                                }`}
                                                        >
                                                            {group.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Cards Grid */}
                                            <div className="pb-8 px-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {currentOffers[activeOfferTab]?.offer?.map((offer, idx) => (
                                                        <div
                                                            key={offer.id || idx}
                                                            className="group relative bg-[#040811] border border-white/5 rounded p-4 hover:border-red-500/30 transition-all overflow-hidden flex flex-col w-full min-w-0 shadow-xl"
                                                        >
                                                            <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                            <div className="relative z-10 flex justify-between items-start mb-3 text-left">
                                                                <div className="flex flex-col">
                                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                                                                        {offer.category || offer.subcategory || (offerCategory === "voice_sms" ? "VOICE/SMS" : "PACKAGE")}
                                                                    </div>
                                                                    <h4 className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{offer.name}</h4>
                                                                </div>
                                                                <div className="bg-red-600/10 border border-red-500/30 px-2 py-1 rounded text-[11px] font-black text-red-500 font-mono shadow-[0_0_10px_rgba(239,68,68,0.1)] shrink-0 ml-2">
                                                                    {formatBalance(offer.price)}
                                                                </div>
                                                            </div>
                                                            <div className="relative z-10 flex-1 mb-4 text-left">
                                                                <div
                                                                    className="text-[10px] text-gray-400 leading-relaxed line-clamp-3 overflow-hidden offer-desc-html"
                                                                    dangerouslySetInnerHTML={{ __html: offer.longdesc || offer.shortdesc }}
                                                                />
                                                            </div>
                                                            <div className="relative z-10 pt-3 border-t border-white/[0.03] flex items-center justify-between gap-3">
                                                                <div className="flex flex-col text-left">
                                                                    <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">VALIDITY</div>
                                                                    <div className="text-[10px] text-gray-300 font-black font-mono">{offer.productlength || "-"}</div>
                                                                </div>
                                                                <button
                                                                    className="px-4 py-1.5 bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-500 rounded-sm text-[9px] font-black text-white uppercase tracking-widest transition-all shadow-sm hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                                                                    onClick={() => toast.success(`Coming soon...`)}
                                                                >
                                                                    Buy Now
                                                                </button>
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600/20 rotate-45 pointer-events-none group-hover:bg-red-600/40 transition-colors" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="px-6 py-12 flex flex-col items-center justify-center text-center opacity-40">
                                        <Zap className="w-8 h-8 text-gray-600 mb-3" />
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            No offers found in this segment
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
