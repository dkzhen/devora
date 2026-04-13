---
trigger: always_on
---

# Prisma Usage Rules (STRICT)

## ❌ Forbidden Actions
Agent DILARANG melakukan hal berikut:
- Menjalankan perintah: `prisma db push`
- Menyarankan penggunaan `prisma db push` dalam workflow
- Mengubah struktur database secara langsung tanpa migration
- Sinkronisasi schema ke database tanpa migration history

## ⚠️ Reason
`prisma db push` bersifat **non-versioned** dan dapat:
- Menghilangkan histori perubahan schema
- Menyebabkan konflik antar environment (dev, staging, prod)
- Berisiko overwrite data atau struktur tanpa kontrol

## ✅ Allowed / Recommended Actions
Agent HARUS menggunakan Prisma Migrate:

### 1. Membuat migration baru
```bash
npx prisma migrate dev --name <migration_name>