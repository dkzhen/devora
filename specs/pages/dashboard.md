# Dashboard Connection Map

Berkas utama Dashboard terletak di: `src/app/(main)/page.js`

## 🧩 Komponen UI (Frontend)
Berikut adalah daftar komponen yang diimpor dan digunakan dalam halaman utama:

| Komponen | Path Berkas | Deskripsi |
| :--- | :--- | :--- |
| **HeroHeader** | `src/components/HeroHeader.js` | Header utama dengan breadcrumbs dan judul. |
| **DashboardStatCard** | `src/components/DashboardStatCard.js` | Kartu statistik (Connected Accounts, Request Flow, dll). |
| **AirdropActivity** | `src/components/AirdropActivity.js` | Menampilkan daftar aktivitas airdrop terbaru. |
| **TokenUsageCard** | `src/components/TokenUsageCard.js` | Visualisasi penggunaan token. |
| **GmailActivityCard** | `src/components/GmailActivityCard.js` | Menampilkan insight atau aktivitas dari Gmail. |
| **DriveInsightsCard** | `src/components/DriveInsightsCard.js` | Statistik atau ringkasan dari Google Drive. |
| **AiUsageMonitoring** | `src/components/AiUsageMonitoring.js` | Runtime monitoring untuk AI Cluster. |

---

## 🔌 API & Data Fetching
Dashboard mengambil data secara real-time dari endpoint berikut:

- **Endpoint**: `/api/monitoring`
- **Path Berkas**: `src/app/api/monitoring/route.js`
- **Data yang diambil**: Summary akun, statistik API (hit counts), statistik Temp Mail, data airdrop, token usage, dll.

---

## 🖼️ Aset Statis (Icons)
Ikon-ikon yang digunakan dalam kartu statistik:

- `/icons/dashbooard/google.png`
- `/icons/dashbooard/api.png`
- `/icons/dashbooard/email.png`

---

## 🛠️ Alur Kerja (Logic Flow)
1. **Mounting**: Saat halaman dimuat, `useEffect` menjalankan `fetchStats`.
2. **Fetch**: Memanggil `GET /api/monitoring`.
3. **State Management**: Data disimpan ke dalam state `stats`.
4. **Rendering**: Komponen-komponen menerima data dari state `stats` melalui props.
