# Gmail Account Manager

Modern dashboard management akun Gmail berbasis OAuth untuk menyimpan refresh token dan melakukan maintenance API read-only agar akun tetap aktif.

## Fitur

- ✅ **OAuth Google Authentication** - Login dengan akun Gmail
- ✅ **Gmail Stats** - Monitor total messages & threads untuk setiap akun
- ✅ **Account Management** - Tambah, hapus, dan kelola multiple akun Gmail
- ✅ **Auto Maintenance** - Cron job untuk menjaga akun tetap aktif (setiap 3 bulan)
- ✅ **API Status Check** - Validasi status akun melalui Gmail API
- ✅ **Modern UI** - Interface futuristik dark theme dengan animasi smooth
- ✅ **Responsive Design** - Mobile-first, perfect di semua device
- ✅ **Real-time Updates** - Refresh individual atau all accounts
- ✅ **JSON Storage** - Data tersimpan dalam file JSON lokal

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML + CSS + Vanilla JavaScript (No Framework!)
- **Authentication**: Passport.js + Google OAuth 2.0
- **API**: Gmail API (googleapis)
- **Storage**: File JSON (tanpa database)
- **Styling**: Pure CSS dengan CSS Variables

## Setup Instructions

### 1. Clone dan Install Dependencies

```bash
git clone <repository-url>
cd google-api
npm install
```

### 2. Google Cloud Console Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Gmail API**:
   - Pergi ke "APIs & Services" > "Library"
   - Cari "Gmail API" dan klik "Enable"
4. Buat OAuth 2.0 Credentials:
   - Pergi ke "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Gmail Account Manager" (atau nama lain)
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
   - Klik "Create"
5. Copy **Client ID** dan **Client Secret**

### 3. Environment Variables

Buat file `.env` di root project:

```env
CLIENT_ID=your_google_client_id_here
CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_session_secret_here
PORT=3000
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Struktur Project

```
/
├── server.js              # Main server file dengan API endpoints
├── package.json           # Dependencies
├── accounts.json          # Data storage (auto-created)
├── .env                   # Environment variables
└── public/
    ├── index.html        # Homepage (static HTML)
    ├── app.js            # Client-side JavaScript
    └── style.css         # Modern CSS styling
```

## API Endpoints

### Server Routes

- `GET /` - Serve static homepage
- `GET /api/accounts` - Get all accounts (JSON)
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback

### API Endpoints

- `POST /check-account` - Check account status via Gmail API
- `POST /remove-account` - Remove account from storage

## Google OAuth Scopes

Aplikasi ini menggunakan scope minimal yang diperlukan:

- `profile` - Akses profil user
- `email` - Akses email user
- `https://www.googleapis.com/auth/gmail.readonly` - Read-only akses Gmail

## Gmail Stats

Untuk setiap akun, aplikasi menampilkan:

- **Total Messages** - Jumlah total email dalam inbox
- **Total Threads** - Jumlah total conversation threads
- **Last Check** - Waktu terakhir pengecekan status
- **Status** - Active/Invalid

## Cron Job Schedule

- **Schedule**: Setiap 3 bulan (0 0 1 _/3 _)
- **Action**: Hit Gmail API untuk semua akun terdaftar
- **Purpose**: Menjaga refresh token tetap aktif dan akun tidak expire
- **Testing**: Ubah schedule menjadi `* * * * *` untuk test setiap menit

## Data Structure

Format data dalam `accounts.json`:

```json
[
  {
    "email": "user@gmail.com",
    "name": "User Name",
    "refresh_token": "1//04xxx...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_check": "2024-01-15T10:30:00.000Z",
    "status": "active",
    "total_messages": 15420,
    "total_threads": 3251
  }
]
```

## Status Values

- `active` - Akun aktif dan refresh token valid
- `invalid` - API call gagal, kemungkinan token expired

## UI Features

### Modern Design

- 🎨 Dark theme futuristik
- 🌈 Gradient effects & smooth animations
- 📱 Mobile-first responsive
- ⚡ Fast & lightweight (no framework)
- 🎯 Clean & minimalist

### Interactive Elements

- ➕ Add account button dengan OAuth flow
- 🔄 Refresh all accounts
- ✅ Check individual account
- 🗑️ Remove account dengan confirmation
- 📊 Real-time stats update
- 🔔 Toast notifications

## Security Notes

- Refresh token disimpan di file JSON lokal
- Session menggunakan secret key (set via environment variable)
- Tidak ada database eksternal yang perlu diamankan
- Scope API minimal (read-only Gmail)
- Client-side menggunakan vanilla JS tanpa external dependencies

## Troubleshooting

### Error: "No refresh token received"

- Pastikan `accessType: "offline"` dan `prompt: "consent"` di setup OAuth
- User harus memberikan consent ulang untuk mendapatkan refresh token

### Error: "Invalid credentials"

- Periksa CLIENT_ID dan CLIENT_SECRET di file .env
- Pastikan redirect URI di Google Cloud Console sesuai: `http://localhost:3000/auth/google/callback`

### Error: "API call failed"

- Periksa apakah Gmail API sudah diaktifkan di Google Cloud Console
- Cek apakah refresh token masih valid (mungkin expired)

### UI tidak muncul dengan benar

- Clear browser cache
- Pastikan semua file static ada di folder /public
- Check console browser untuk error JavaScript

## Development

Untuk development dengan auto-reload:

```bash
npm run dev
```

Menggunakan nodemon untuk restart otomatis saat file berubah.

## Production Notes

Untuk production deployment:

- Ganti `http://localhost:3000` dengan domain production di:
  - Google Cloud Console redirect URI
  - `callbackURL` di server.js
- Set environment variables di server production
- Gunakan process manager seperti PM2
- Setup HTTPS/SSL certificate
- Pertimbangkan rate limiting untuk API endpoints

## Performance

- ⚡ Zero external CSS/JS frameworks
- 🚀 Pure vanilla JavaScript untuk maximum performance
- 📦 Minimal bundle size
- 🎯 Efficient API calls dengan caching
- 💨 Fast page load (<100ms)

---

**Author**: Your Name  
**Version**: 2.0.0  
**Last Updated**: February 2026

## Setup Instructions

### 1. Clone dan Install Dependencies

```bash
git clone <repository-url>
cd google-api
npm install
```

### 2. Google Cloud Console Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan **Google Drive API**:
   - Pergi ke "APIs & Services" > "Library"
   - Cari "Google Drive API" dan klik "Enable"
4. Buat OAuth 2.0 Credentials:
   - Pergi ke "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Google Account Dashboard" (atau nama lain)
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
   - Klik "Create"
5. Copy **Client ID** dan **Client Secret**

### 3. Environment Variables

Buat file `.env` di root project:

```env
CLIENT_ID=your_google_client_id_here
CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_session_secret_here
PORT=3000
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Struktur Project

```
/
├── server.js              # Main server file
├── package.json           # Dependencies
├── accounts.json          # Data storage
├── .env                   # Environment variables
├── views/
│   ├── index.ejs         # Homepage template
│   └── error.ejs         # Error page template
└── public/
    └── style.css         # CSS styling
```

## API Endpoints

- `GET /` - Homepage (dashboard)
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /check-account` - Check account status via API
- `POST /remove-account` - Remove account from storage

## Google OAuth Scopes

Aplikasi ini menggunakan scope minimal yang diperlukan:

- `profile` - Akses profil user
- `email` - Akses email user
- `https://www.googleapis.com/auth/drive.metadata.readonly` - Read-only akses metadata Google Drive

## Cron Job Schedule

- **Schedule**: Setiap 3 bulan (0 0 1 _/3 _)
- **Action**: Hit Google Drive API untuk semua akun terdaftar
- **Purpose**: Menjaga refresh token tetap aktif dan akun tidak expire

## Data Structure

Format data dalam `accounts.json`:

```json
[
  {
    "email": "user@gmail.com",
    "name": "User Name",
    "refresh_token": "1//04xxx...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_check": "2024-01-15T10:30:00.000Z",
    "status": "active"
  }
]
```

## Status Values

- `active` - Akun aktif dan refresh token valid
- `invalid` - API call gagal, kemungkinan token expired

## Security Notes

- Refresh token disimpan di file JSON lokal
- Session menggunakan secret key (set via environment variable)
- Tidak ada database eksternal yang perlu diamankan
- Scope API minimal (read-only)

## Troubleshooting

### Error: "No refresh token received"

- Pastikan `accessType: "offline"` dan `prompt: "consent"` di setup OAuth
- User harus memberikan consent ulang untuk mendapatkan refresh token

### Error: "Invalid credentials"

- Periksa CLIENT_ID dan CLIENT_SECRET di file .env
- Pastikan redirect URI di Google Cloud Console sesuai: `http://localhost:3000/auth/google/callback`

### Error: "API call failed"

- Periksa apakah Google Drive API sudah diaktifkan di Google Cloud Console
- Cek apakah refresh token masih valid (mungkin expired)

## Development

Untuk development dengan auto-reload:

```bash
npm run dev
```

Menggunakan nodemon untuk restart otomatis saat file berubah.

## Production Notes

Untuk production deployment:

- Ganti `http://localhost:3000` dengan domain production di:
  - Google Cloud Console redirect URI
  - `callbackURL` di server.js
- Set environment variables di server production
- Pertimbangkan menggunakan database yang lebih robust untuk production scale

---

**Author**: GitHub Copilot  
**Version**: 1.0.0
