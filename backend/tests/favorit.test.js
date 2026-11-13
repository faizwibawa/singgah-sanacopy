// Test fitur favorit (P4).

const { app, request, createUser, createKos, auth } = require('./helpers');
const Favorit = require('../src/models/Favorit');

const tambahFavorit = (token, kosId) =>
  request(app).post(`/api/favorit/${kosId}`).set(auth(token));

const hapusFavorit = (token, kosId) =>
  request(app).delete(`/api/favorit/${kosId}`).set(auth(token));

let pemilik;
let tokenPemilik;
let pencari;
let tokenPencari;

beforeEach(async () => {
  ({ user: pemilik, token: tokenPemilik } = await createUser('pemilik'));
  ({ user: pencari, token: tokenPencari } = await createUser('pencari'));
});

describe('POST /api/favorit/:kosId (tambah favorit)', () => {
  it('pencari bisa menambah kos approved ke favorit', async () => {
    const kos = await createKos(pemilik);

    const res = await tambahFavorit(tokenPencari, kos._id);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kos_id).toBe(String(kos._id));
    expect(await Favorit.countDocuments({ user_id: pencari._id, kos_id: kos._id })).toBe(1);
  });

  it('menolak kos yang sudah ada di favorit dengan 400', async () => {
    const kos = await createKos(pemilik);
    await tambahFavorit(tokenPencari, kos._id);

    const res = await tambahFavorit(tokenPencari, kos._id);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/sudah ada/);
    expect(await Favorit.countDocuments()).toBe(1);
  });

  it.each(['pending', 'rejected'])('menolak kos berstatus %s dengan 400', async (status) => {
    const kos = await createKos(pemilik, { status_verifikasi: status });

    const res = await tambahFavorit(tokenPencari, kos._id);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/belum disetujui/);
    expect(await Favorit.countDocuments()).toBe(0);
  });

  it('mengembalikan 404 jika kos tidak ada', async () => {
    const res = await tambahFavorit(tokenPencari, '64b000000000000000000000');

    expect(res.statusCode).toBe(404);
  });

  it('mengembalikan 400 untuk format ID yang tidak valid', async () => {
    const res = await tambahFavorit(tokenPencari, 'bukan-id');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it.each(['pemilik', 'admin'])('menolak role %s dengan 403', async (role) => {
    const kos = await createKos(pemilik);
    const token = role === 'pemilik' ? tokenPemilik : (await createUser('admin')).token;

    const res = await tambahFavorit(token, kos._id);

    expect(res.statusCode).toBe(403);
    expect(await Favorit.countDocuments()).toBe(0);
  });

  it('menolak request tanpa token dengan 401', async () => {
    const kos = await createKos(pemilik);

    const res = await request(app).post(`/api/favorit/${kos._id}`);

    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/favorit/:kosId (hapus favorit)', () => {
  it('pencari bisa menghapus kos dari favoritnya', async () => {
    const kos = await createKos(pemilik);
    await tambahFavorit(tokenPencari, kos._id);

    const res = await hapusFavorit(tokenPencari, kos._id);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await Favorit.countDocuments()).toBe(0);
  });

  it('mengembalikan 404 jika kos tidak ada di favorit', async () => {
    const kos = await createKos(pemilik);

    const res = await hapusFavorit(tokenPencari, kos._id);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('tidak menghapus favorit milik pencari lain', async () => {
    const kos = await createKos(pemilik);
    const { token: tokenLain } = await createUser('pencari');
    await tambahFavorit(tokenPencari, kos._id);

    const res = await hapusFavorit(tokenLain, kos._id);

    expect(res.statusCode).toBe(404);
    expect(await Favorit.countDocuments({ user_id: pencari._id })).toBe(1);
  });
});

describe('GET /api/favorit (daftar favorit)', () => {
  it('hanya menampilkan favorit milik pencari yang login, terbaru dulu', async () => {
    const kosLama = await createKos(pemilik, { nama: 'Kos Lama' });
    const kosBaru = await createKos(pemilik, { nama: 'Kos Baru' });
    const { token: tokenLain } = await createUser('pencari');
    await tambahFavorit(tokenPencari, kosLama._id);
    await tambahFavorit(tokenPencari, kosBaru._id);
    await tambahFavorit(tokenLain, kosLama._id);

    const res = await request(app).get('/api/favorit').set(auth(tokenPencari));

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data.map((f) => f.kos_id.nama)).toEqual(['Kos Baru', 'Kos Lama']);
    expect(res.body.data[0].kos_id.pemilik_id.nama).toBe(pemilik.nama);
  });

  it('mengembalikan array kosong jika belum ada favorit', async () => {
    const res = await request(app).get('/api/favorit').set(auth(tokenPencari));

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});
