# Testing Backend Singgah-sana

Test memakai **Jest** + **Supertest** + **mongodb-memory-server**.
Setiap file test berjalan di database MongoDB sementara di memori, jadi:

- tidak perlu MongoDB terpasang di laptop,
- tidak menyentuh `singgah_sana_db` (data seeder aman),
- data dihapus otomatis setelah setiap `it(...)`.

## Menjalankan

```bash
cd backend
npm install
npm test              # jalankan semua test
npm run test:watch    # jalankan ulang otomatis saat file berubah
npx jest tests/kos.public.test.js   # satu file saja
```

Pertama kali dijalankan, `mongodb-memory-server` mengunduh binary MongoDB (sekitar 100 MB) ke cache. Run berikutnya langsung cepat.

## Struktur

| File | Isi |
| --- | --- |
| `setup.js` | Menyalakan/mematikan MongoDB in-memory, membersihkan data tiap test, set `JWT_SECRET` khusus test |
| `helpers.js` | `createUser(role)`, `createKos(owner, overrides)`, `auth(token)` |
| `*.test.js` | File test, satu per modul (mis. `favorit.test.js`, `inquiry.test.js`) |

## Pola menulis test

```js
const { app, request, createUser, createKos, auth } = require('./helpers');

describe('POST /api/favorit/:kosId', () => {
  it('pencari bisa menambah kos approved ke favorit', async () => {
    const { user: pemilik } = await createUser('pemilik');
    const kos = await createKos(pemilik);              // default: approved
    const { token } = await createUser('pencari');

    const res = await request(app)
      .post(`/api/favorit/${kos._id}`)
      .set(auth(token));

    expect(res.statusCode).toBe(201);
  });
});
```

Tips:

- `createUser('admin')` juga bisa (dibuat langsung lewat model, bukan form register).
- Kos pending: `createKos(pemilik, { status_verifikasi: 'pending' })`.
- Satu `it` = satu perilaku. Nama test dalam Bahasa Indonesia, menjelaskan hasil yang diharapkan.
- Selalu cek `statusCode`, lalu isi `res.body` yang penting.

## Pembagian file test

| File | Pemilik | Task |
| --- | --- | --- |
| `kos.public.test.js` | Faiz (contoh) | P3 |
| `kos.owner.test.js` | Farand | F5 |
| `auth.test.js` | Stella | S6 |
| `favorit.test.js`, `inquiry.test.js` | Faiz | P4 |
| `admin.test.js`, `search.test.js` | Aurelia | A6 |
