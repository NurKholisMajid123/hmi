# Setup Database PostgreSQL – HMI

Dokumentasi ini berisi langkah-langkah setup database PostgreSQL untuk kebutuhan autentikasi pengguna dan manajemen session login aplikasi Himpunan Mahasiswa Islam.

---

## Prasyarat
- Sistem operasi Linux (Ubuntu direkomendasikan)
- PostgreSQL sudah terinstall
- Akses sudo

---

## Masuk ke PostgreSQL
Login sebagai user `postgres` dan buka PostgreSQL shell:

```bash
sudo -i -u postgres psql
```

---

## Membuat Database
Buat database dengan nama `hmi`:

```sql
CREATE DATABASE hmi;
```

Masuk ke database `hmi`:

```sql
\c hmi
```

---

## Tabel Users (Autentikasi)
Tabel ini digunakan untuk menyimpan data akun pengguna.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Tabel Session (Login Session)
Tabel ini digunakan untuk menyimpan session login aplikasi (misalnya untuk Node.js / Express).

```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
```

Tambahkan primary key pada kolom `sid`:

```sql
ALTER TABLE "session"
ADD CONSTRAINT "session_pkey"
PRIMARY KEY ("sid")
NOT DEFERRABLE INITIALLY IMMEDIATE;
```

Buat index untuk kolom `expire`:

```sql
CREATE INDEX "IDX_session_expire"
ON "session" ("expire");
```

---

## Catatan Penting
- Tabel `"session"` menggunakan tanda kutip karena nama tabel bersifat umum
- Kolom `sess` bertipe `json` untuk menyimpan data session
- Index `expire` membantu performa saat pembersihan session kadaluarsa
- Password **wajib disimpan dalam bentuk hash** (bcrypt / argon2)

---

## Keluar dari PostgreSQL
Keluar dari PostgreSQL shell:

```sql
\q
```

Keluar dari user postgres:

```bash
exit
```

---

## Author
Himpunan Mahasiswa Islam – Cabang Malang
