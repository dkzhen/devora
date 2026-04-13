# Airdrop Page Connection Map

Halaman utama Airdrop (Drop Hunting) terletak di: `src/app/(main)/airdrops/page.js`

## 🧩 Komponen UI (Frontend)
Halaman ini mengandalkan komponen-komponen berikut untuk tampilannya:

| Komponen | Path Berkas | Deskripsi |
| :--- | :--- | :--- |
| **HeroHeader** | `src/components/HeroHeader.js` | Digunakan untuk header halaman, breadcrumbs, dan tombol aksi (ActionHero). |
| **LoadingImage** | `src/components/LoadingImage.js` | Komponen pembungkus gambar ikon proyek agar memiliki state loading yang halus. |
| **LoadingState** | `src/components/HeroHeader.js` | Tampilan loading saat data airdrop sedang diambil dari server. |

---

## 🔌 API & Data Fetching
Halaman ini melakukan interaksi data dengan endpoint-endpoint berikut:

### Core Airdrops
- **Path Berkas**: `src/app/api/airdrops/route.js`
  - `GET`: Mengambil semua daftar proyek airdrop.
  - `POST`: Menambah proyek airdrop baru.
- **Path Berkas**: `src/app/api/airdrops/[id]/route.js`
  - `PUT`: Memperbarui data proyek tertentu.
  - `DELETE`: Menghapus proyek dari sistem.

### Suggestions (Rekomendasi)
- **Path Berkas**: `src/app/api/airdrops/suggest/route.js`
  - `GET`: Mengambil daftar saran proyek dari pengguna lain.
  - `POST`: Mengirimkan saran proyek baru.
- **Path Berkas**: `src/app/api/airdrops/suggest/[id]/route.js`
  - `DELETE`: Menghapus saran (digunakan setelah proses audit selesai).

### Auth Check
- **Endpoint**: `/api/auth/me`
  - Digunakan untuk memverifikasi peran pengguna (misal: mengecek apakah user memiliki role 'ULTRA' untuk fitur audit/hapus).

---

## 🔗 Navigasi & Hubungan Halaman
- **Detail Proyek**: Diarahkan ke `src/app/(main)/airdrops/[id]/page.js` (saat baris tabel diklik).
- **Breadcrumbs**: Terhubung kembali ke `src/app/(main)/page.js` (Dashboard Utama).

---

## 🛠️ Alur Kerja (Core Logic)
1. **Mounting**: Mengecek auth di local storage atau `/api/auth/me`, lalu mengambil data airdrop dan suggestions.
2. **Filtering**: Mendukung filter berdasarkan nama, tipe tugas (task type), status, dan visibilitas (Public/Private/Pending).
3. **Audit Workflow**: User Admin bisa melihat "Suggested Projects", lalu klik "Audit" untuk membukanya di modal "Add Project", dan menyimpannya secara resmi ke database.
