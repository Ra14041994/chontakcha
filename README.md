# Cho‘ntakcha

Yaqin atrofdagi do‘konlar narxlarini solishtirish sayti (Chortoq · Namangan · Uychi · Uchqo‘rg‘on).

**Stack:** Next.js 16 (App Router) · Postgres (Neon) · Vercel Blob (rasmlar) · Telegram bot (kirish va bildirishnomalar) · OpenStreetMap (Leaflet).

## Imkoniyatlar

- **Xaridor:** bosh sahifa, qidiruv (filtrlar, “Eng arzon” / “Eng foydali”, narx solishtirish), xarita, e’lon va biznes sahifalari, saqlanganlar, kuzatish, chat, band qilish, baho va izohlar, bildirishnomalar.
- **Sotuvchi:** e’lon qo‘shish sehrgari (rasm yuklash, narx oralig‘i tavsiyasi), birinchi oy bepul obuna, boshqaruv paneli (7 kunlik statistika), e’lonlarim, narxlarni bir tugma bilan tasdiqlash, bandlar, izohlarga javob, aksiyalar.
- **Admin (`/admin`):** obunani qo‘lda uzaytirish (+30 kun), shikoyatlar, e’lonlarni yashirish, foydalanuvchini bloklash, namuna ma’lumotlarni o‘chirish/qaytarish, Telegram webhook holati.

Barcha ma’lumotlar serverdagi bazada saqlanadi — bitta foydalanuvchi qo‘shgan e’lon va rasmni hamma ko‘radi.

## Lokal ishga tushirish

```bash
npm install
npm run dev
```

Lokal rejimda hech qanday kalit shart emas: baza `.data/pglite` ichida (PGlite), rasmlar `.data/uploads` ichida saqlanadi, `/kirish` sahifasida “Sinov kirish” formasi bor.

## Vercel’ga joylash

1. Loyiha GitHub’dan import qilinadi (framework: Next.js).
2. **Storage → Neon (Postgres)** — bazani yarating va loyihaga ulang (`DATABASE_URL` avtomatik qo‘shiladi). Mintaqa: *Frankfurt (eu-central-1)*.
3. **Storage → Blob** — public store yarating va ulang (`BLOB_READ_WRITE_TOKEN`).
4. Environment Variables: `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN` (Sensitive), `ADMIN_PHONES`, `CRON_SECRET`, ixtiyoriy `SEED_SAMPLE=0`.
5. Redeploy. Jadval va namuna ma’lumotlar birinchi so‘rovda avtomatik yaratiladi. Telegram webhook birinchi “Telegram orqali kirish” bosilganda o‘rnatiladi (yoki `/admin` → Sozlama).

Batafsil: `.env.example`.
