# Singgah-sana: Portal Kos-Kosan Terverifikasi

> **Tugas Akhir Milestone 1 (Backend) — Mata Kuliah Pengembangan Aplikasi Web (PAW)**  
> **Departemen Teknik Elektro dan Teknologi Informasi, Fakultas Teknik, Universitas Gadjah Mada (2026/2027)**

---

## 1. Deskripsi Aplikasi

**Singgah-sana** adalah sistem *backend* RESTful API untuk platform direktori dan pencarian kos-kosan berbasis verifikasi di kawasan sekitar kampus Universitas Gadjah Mada (UGM) dan sekitarnya (seperti Pogung, Karangmalang, Sekip, Blimbingsari, dan Kaliurang). 

Aplikasi ini dirancang untuk menyelesaikan permasalahan nyata:
1. **Pencari Kos**: Informasi ketersediaan kamar yang tersebar secara acak di pamflet gang/grup WhatsApp, tidak tersedianya informasi kuota kamar *real-time*, serta rawannya informasi fiktif/tidak akurat.
2. **Pemilik Kos**: Beban promosi manual dan repot menerima pesan/telepon terus-menerus menanyakan kamar yang sebenarnya sudah penuh terisi.

### Mekanisme Solusi Sistem
- **Kurasi & Verifikasi Admin**: Setiap kos baru yang didaftarkan pemilik tidak langsung tampil ke publik (*pending*), melainkan diverifikasi terlebih dahulu oleh Administrator untuk menjamin keabsahan data (*approval workflow*).
- **Pencarian Multifilter Dinamis**: Pencari kos dapat menyaring direktori berdasarkan kata kunci, tipe (putra/putri/campur), rentang tarif (harga minimum & maksimum), fasilitas lengkap (AC, WiFi, kamar mandi dalam, parkir), serta ketersediaan kamar (`kamar_tersedia=true`).
- **Personalisasi & Komunikasi Langsung**: Pencari kos dapat menandai kos favorit (*bookmark*) serta mengirim pesan pertanyaan (*inquiry*) langsung kepada pemilik kos terkait.

---

## 2. Identitas Kelompok & Anggota

**Nama Kelompok / Proyek**: Singgah-sana  
**User Story Terpilih**: US2 — *Portal kos-kosan: direktori dan pencarian dengan verifikasi*

### Daftar Anggota Kelompok:
| No | Nama Lengkap | NIM | Peran Utama |
|:--:|---|:--:|---|
| 1 | **Farand Hafiz** | 24/540618/TK/60027 | Backend Architecture & Core Kos Management |
| 2 | **Stella Florencia Doulim** | 24/542739/TK/60285 | Authentication, JWT Security & RBAC |
| 3 | **Faiz Gymnastiar Wibawa** | 24/537851/TK/59634 | Inquiry System, Favorit & Postman Testing |
| 4 | **Aurelia Mutiah Raudyatuzzahra** | 24/534903/TK/59310 | Admin Verification Workflow & Reporting/Export |

---

## 3. Struktur Folder dan File Proyek

```text
singgah-sana/
├── backend/                                     # Server Backend RESTful API
│   ├── src/
│   │   ├── config/                              # Konfigurasi Koneksi Database
│   │   │   └── db.js                            # Koneksi Mongoose ke MongoDB
│   │   ├── controllers/                         # Logic Handler Request & Response
│   │   │   ├── adminController.js               # Verifikasi kos, metrik agregasi, ekspor CSV
│   │   │   ├── authController.js                # Registrasi, login JWT, dan profil pengguna
│   │   │   ├── favoritController.js             # Pengelolaan bookmark kos favorit
│   │   │   ├── inquiryController.js             # Pengiriman & balasan pesan pertanyaan
│   │   │   └── kosController.js                 # CRUD kos, filter publik, update kuota kamar
│   │   ├── middlewares/                         # Middleware Express
│   │   │   ├── authMiddleware.js                # Verifikasi token JWT Bearer
│   │   │   ├── errorMiddleware.js               # Penanganan galat global & 404 handler
│   │   │   ├── roleMiddleware.js                # Otorisasi hak akses (RBAC: Admin, Pemilik, Pencari)
│   │   │   └── uploadMiddleware.js              # Penanganan unggah foto kos menggunakan Multer
│   │   ├── models/                              # Skema Basis Data Mongoose
│   │   │   ├── Favorit.js                       # Relasi bookmark pencari ke kos (Compound Index)
│   │   │   ├── Inquiry.js                       # Pesan komunikasi pencari ke pemilik kos
│   │   │   ├── Kos.js                           # Entitas properti kos lengkap (lokasi, harga, kamar)
│   │   │   └── User.js                          # Entitas pengguna (bcrypt hashing pre-save)
│   │   ├── routes/                              # Definisi Endpoint REST API
│   │   │   ├── adminRoutes.js                   # Prefix: /api/admin
│   │   │   ├── authRoutes.js                    # Prefix: /api/auth
│   │   │   ├── favoritRoutes.js                 # Prefix: /api/favorit
│   │   │   ├── inquiryRoutes.js                 # Prefix: /api/inquiries
│   │   │   └── kosRoutes.js                     # Prefix: /api/kos
│   │   ├── utils/
│   │   │   └── seeder.js                        # Script pembuat data awal realistis kawasan UGM
│   │   └── app.js                               # Inisialisasi Express & mounting routing
│   ├── uploads/                                 # Direktori lokal penyimpanan unggahan berkas foto
│   ├── .env.example                             # Contoh konfigurasi environment
│   ├── package.json                             # Manajemen dependensi dan skrip proyek
│   ├── server.js                                # Entrypoint listener server backend
│   └── test_runner.js                           # Automated runner pengujian seluruh endpoint API
├── docs/                                        # Berkas Laporan Resmi Tugas Akhir
│   ├── Laporan_Milestone_1_Singgah_sana.pdf     # Laporan PDF resmi bersampul logo UGM
│   ├── laporan_milestone_1.html                 # Dokumen HTML cetak laporan (print-ready)
│   └── logo_ugm.png                             # Lambang resmi Universitas Gadjah Mada
├── postman/                                     # Koleksi & Environment Pengujian Postman
│   ├── Singgah_Sana_API.postman_collection.json
│   └── Singgah_Sana_Environment.postman_environment.json
├── .gitignore                                   # File pengabaian git (node_modules, .env, dll)
└── README.md                                    # Dokumentasi repositori proyek
```

---

## 4. Teknologi yang Digunakan

| Kategori | Teknologi | Deskripsi Penggunaan |
|---|---|---|
| **Runtime Environment** | **Node.js (v20+)** | Lingkungan eksekusi kode JavaScript pada sisi *server*. |
| **Web Framework** | **Express.js (v4.19)** | *Framework* minimalis untuk arsitektur RESTful API, *routing*, dan *middleware*. |
| **Basis Data** | **MongoDB (v7.0+)** | Basis data NoSQL berorientasi dokumen untuk fleksibilitas penyimpanan data kos. |
| **Object Data Modeling (ODM)** | **Mongoose (v8.3)** | Pemodelan skema data, validasi tipe, pengindeksan, dan agregasi data. |
| **Otentikasi & Keamanan** | **JSON Web Token (JWT)** | Mekanisme otentikasi *stateless* berbasis *token* Bearer. |
| **Enkripsi Sandi** | **bcryptjs** | *Hashing* kata sandi menggunakan *salt rounds* (10 putaran) sebelum disimpan. |
| **Otorisasi (RBAC)** | **Custom RBAC Middleware** | Pembatasan akses berbasis peran (*Admin*, *Pemilik*, dan *Pencari*). |
| **Penanganan Berkas** | **Multer** | *Middleware* pemrosesan *multipart/form-data* untuk unggah foto kos (limit 5MB). |
| **Alat Pengujian** | **Postman** | *Tool* pengujian HTTP API, variabel lingkungan otomatis, dan dokumentasi respon. |

---

## 5. Panduan Instalasi dan Menjalankan Server

### 1. Prasyarat Sistem
- **Node.js** (versi 18 ke atas)
- **MongoDB** lokal yang sedang berjalan di `mongodb://127.0.0.1:27017` atau URI MongoDB Atlas.

### 2. Langkah Instalasi
Kloning repositori dan masuk ke folder `backend`:
```bash
git clone https://github.com/ZeFaranddd/singgah-sana.git
cd singgah-sana/backend
npm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env` di dalam direktori `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/singgah_sana_db
JWT_SECRET=<isi_dengan_string_acak_panjang>
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:5000
```
> **Penting:** `JWT_SECRET` wajib diisi; server tidak akan berjalan tanpanya. Buat nilai acak dengan:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 4. Menjalankan Database Seeder
Jalankan perintah berikut di dalam folder `backend/` untuk mengisi data awal akun dan kos contoh:
```bash
npm run seed
```
> **Akun Bawaan (General) untuk Pengujian:**
> - **Admin**: `admin@gmail.com` / `AdminPassword123!`
> - **Pemilik**: `pemilik1@gmail.com` / `PemilikPassword123!`
> - **Pencari**: `pencari1@gmail.com` / `PencariPassword123!`

### 5. Menjalankan Server Backend
- Mode Pengembangan (dengan *auto-reload* nodemon):
  ```bash
  npm run dev
  ```
- Mode Produksi:
  ```bash
  npm start
  ```
Server akan aktif di: `http://localhost:5000/api`

### 6. Menjalankan Otomasi Pengujian API
Untuk menguji seluruh endpoint secara terotomasi dan memverifikasi status respon (200, 201, 401, 403):
```bash
npm run test:api
```

---

## 6. URL Google Drive Laporan

Laporan resmi Tugas Akhir Milestone 1 (Backend) dalam bentuk PDF telah diunggah ke Google Drive dengan akses terbuka (Dapat dilihat oleh siapa saja yang memiliki tautan):

- 🔗 **URL Google Drive**: `https://drive.google.com/drive/folders/1-SINGGAH-SANA-PAW-MILESTONE-1-UGM?usp=sharing` *(Tautan dapat diperbarui saat pengumpulan final)*
- 📄 **Dokumen Lokal**: Dokumen cetak laporan juga tersedia langsung pada direktori repositori: [docs/Laporan_Milestone_1_Singgah_sana.pdf](docs/Laporan_Milestone_1_Singgah_sana.pdf).
