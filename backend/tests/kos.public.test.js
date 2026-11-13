// Contoh test (pola yang bisa ditiru anggota lain).
// Menguji aturan inti "kos terverifikasi": hanya kos approved yang tampil ke publik.

const { app, request, createUser, createKos, auth } = require('./helpers');

describe('GET /api/kos (listing publik)', () => {
  it('hanya menampilkan kos yang sudah approved', async () => {
    const { user: pemilik } = await createUser('pemilik');
    await createKos(pemilik, { nama: 'Kos Approved' });
    await createKos(pemilik, { nama: 'Kos Pending', status_verifikasi: 'pending' });
    await createKos(pemilik, { nama: 'Kos Rejected', status_verifikasi: 'rejected' });

    const res = await request(app).get('/api/kos');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.totalData).toBe(1);
    expect(res.body.data.map((k) => k.nama)).toEqual(['Kos Approved']);
  });

  it('mengembalikan array kosong jika belum ada kos approved', async () => {
    const res = await request(app).get('/api/kos');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/kos/:id (detail kos pending)', () => {
  it('menolak pengunjung anonim dengan 403', async () => {
    const { user: pemilik } = await createUser('pemilik');
    const kos = await createKos(pemilik, { status_verifikasi: 'pending' });

    const res = await request(app).get(`/api/kos/${kos._id}`);

    expect(res.statusCode).toBe(403);
  });

  it('mengizinkan pemiliknya sendiri melihat', async () => {
    const { user: pemilik, token } = await createUser('pemilik');
    const kos = await createKos(pemilik, { status_verifikasi: 'pending' });

    const res = await request(app).get(`/api/kos/${kos._id}`).set(auth(token));

    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(String(kos._id));
  });

  it('menolak pemilik lain dengan 403', async () => {
    const { user: pemilikA } = await createUser('pemilik');
    const { token: tokenB } = await createUser('pemilik');
    const kos = await createKos(pemilikA, { status_verifikasi: 'pending' });

    const res = await request(app).get(`/api/kos/${kos._id}`).set(auth(tokenB));

    expect(res.statusCode).toBe(403);
  });
});
