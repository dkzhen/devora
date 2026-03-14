# Gradient Header Generation Spec

Tujuan dokumen ini adalah untuk menjaga **konsistensi desain Header dengan gaya "Gradient"** di seluruh halaman aplikasi. Header ini dilengkapi dengan efek glow, tekstur grid, breadcrumb, serta gradient teks.

Jika user meminta: *"Tolong buatkan header senada dengan chatbot memakai warna [WARNA 1] dan [WARNA 2]..."* atau mereferensikan file ini, silakan gunakan struktur `JSX` berikut dan ganti warna Tailwind-nya sesuai dengan permintaan.

## Struktur dan Komponen Kunci

Header ini terdiri dari:
1. **Background Base**: Menggunakan `bg-linear-to-br` dari `gray-900` ke warna gelap sekunder. (misal: `bg-linear-to-br from-gray-900 via-[#0d1b3e] to-gray-900`).
2. **Glow Effects**: Dua bulatan blur (`blur-3xl`) di pojok kanan-atas dan kiri-bawah.
3. **Grid Texture**: Pola grid transparan (`opacity-[0.03]`).
4. **Breadcrumb Menu**: Berukuran kecil (`text-[11px]`) dengan `font-medium`, menggunakan turunan warna utama. Spasi bawah `mb-3`.
5. **Main Title Text**: Menggabungkan teks putih dengan teks "fill transparent" bersinar menggunakan `bg-clip-text bg-linear-to-r`. Ukuran `text-xl md:text-3xl`.
6. **Subtitle**: Teks ukuran `text-[11px]` hingga `md:text-[13px]` berwarna `gray-400`. Padding utama `p-5 md:p-8`.

## Template Kodegen (JSX)

Gunakan struktur ini sebagai **Dasar Utama** (Ganti token warna huruf kapital seperti `WARNA_UTAMA`, `WARNA_KEDUA`, `WARNA_KETIGA` menyesuaikan permintaan user!):

```jsx
const HeroHeader = () => (
    <div className="relative overflow-hidden rounded-2xl shrink-0 border border-white/5 shadow-2xl">
        {/* Latar Belakang Dasar (Blends with global #080d1a) */}
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-[#080d1a] to-[#080d1a]" />
        
        {/* Glow Effects (Ganti warna sesuai tema) */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[WARNA_UTAMA]-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-[WARNA_KEDUA]-500/10 blur-3xl pointer-events-none" />
        
        {/* Tekstur Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Konten Utama */}
        <div className="relative z-10 p-5 md:p-8 flex flex-row items-center justify-between gap-3">
            <div>
                {/* Breadcrumb Nav */}
                <nav className="flex text-[11px] font-medium text-[WARNA_UTAMA]-300/60 mb-3 items-center gap-2">
                    <a href="/" className="flex items-center gap-1 hover:text-[WARNA_UTAMA]-300 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </a>
                    <svg className="w-3 h-3 text-[WARNA_UTAMA]-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-[WARNA_UTAMA]-200 font-semibold">[CURRENT_PAGE_NAME]</span>
                </nav>
                
                {/* Title */}
                <h1 className="text-xl md:text-3xl font-black tracking-tight leading-none">
                    <span className="text-white">[TITLE_PREFIX] </span>
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-[WARNA_UTAMA]-400 via-[WARNA_KEDUA]-400 to-[WARNA_KETIGA]-400">
                        [HIGHLIGHT_TITLE]
                    </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-gray-400 mt-2 text-[11px] md:text-[13px] font-medium">[SUBTITLE_TEXT]</p>
            </div>
        </div>
    </div>
);
```

## Referensi Setup Warna (Contoh)

- **Chatbot (Emerald/Teal Theme)**: 
  - WARNA_UTAMA = `emerald`
  - WARNA_KEDUA = `teal`
  - WARNA_KETIGA = `cyan`
  


**Instruksi untuk AI**: Saat membuat komponen header di halaman lain untuk sistem ini, bacalah file ini dan terapkan struktur kodenya dengan mengganti nama warna (misalnya `emerald` di-replace menjadi `blue` jika user meminta tema biru). Jaga presisi spasi, ukuran teks, bayangan (shadow), hingga transparansi opacity `...-500/10`.
