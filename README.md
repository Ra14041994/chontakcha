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

### Bir tugma bilan (tavsiya)

[![Vercel’ga joylash](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRa14041994%2Fchontakcha&project-name=chontakcha-uz&repository-name=chontakcha&env=TELEGRAM_BOT_TOKEN%2CADMIN_PHONES&envDescription=TELEGRAM_BOT_TOKEN%20-%20%40BotFather%20bergan%20bot%20tokeni.%20ADMIN_PHONES%20-%20admin%20telefon%20raqami%2C%20masalan%20%2B998943150700&stores=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D)

Tugma repozitoriyani GitHub akkauntingizga nusxalaydi, Neon Postgres bazasi va public Blob omborini o‘zi yaratib ulaydi, `TELEGRAM_BOT_TOKEN` va `ADMIN_PHONES` qiymatlarini so‘raydi. Neon mintaqasi: *Frankfurt*.

Sayt ochilganda Vercel login so‘ralsa: **Settings → Deployment Protection → Vercel Authentication → Standard Protection** (production domeni ochiq bo‘lishi shart — aks holda Telegram webhook ishlamaydi).

### Qo‘lda

1. Loyiha GitHub’dan import qilinadi (framework: Next.js).
2. **Storage → Neon (Postgres)** — bazani yarating va loyihaga ulang (`DATABASE_URL` avtomatik qo‘shiladi). Mintaqa: *Frankfurt (eu-central-1)*.
3. **Storage → Blob** — public store yarating va ulang (`BLOB_READ_WRITE_TOKEN`).
4. Environment Variables: `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN` (Sensitive), `ADMIN_PHONES`, `CRON_SECRET`, ixtiyoriy `SEED_SAMPLE=0`.
5. Redeploy. Jadval va namuna ma’lumotlar birinchi so‘rovda avtomatik yaratiladi. Telegram webhook birinchi “Telegram orqali kirish” bosilganda o‘rnatiladi (yoki `/admin` → Sozlama).

Batafsil: `.env.example`.
