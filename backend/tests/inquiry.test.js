// Test aturan inquiry (P1).

const { app, request, createUser, createKos, auth } = require('./helpers');
const Inquiry = require('../src/models/Inquiry');

const kirimInquiry = (token, body) =>
  request(app).post('/api/inquiries').set(auth(token)).send(body);

const balasInquiry = (token, id, balasan) =>
  request(app).patch(`/api/inquiries/${id}/reply`).set(auth(token)).send({ balasan });

describe('POST /api/inquiries (kirim pertanyaan)', () => {
  let pemilik;
  let tokenPencari;

  beforeEach(async () => {
    ({ user: pemilik } = await createUser('pemilik'));
    ({ token: tokenPencari } = await createUser('pencari'));
  });

  it('pencari bisa mengirim pertanyaan ke kos approved', async () => {
    const kos = await createKos(pemilik);

    const res = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Masih ada kamar?' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('menunggu');
    expect(res.body.data.pemilik_id).toBe(String(pemilik._id));
  });

  it.each(['pending', 'rejected'])('menolak kos berstatus %s dengan 400', async (status) => {
    const kos = await createKos(pemilik, { status_verifikasi: status });

    const res = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Halo' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/belum disetujui/);
    expect(await Inquiry.countDocuments()).toBe(0);
  });

  it('mengembalikan 404 jika kos tidak ada', async () => {
    const res = await kirimInquiry(tokenPencari, {
      kos_id: '64b000000000000000000000',
      pesan: 'Halo',
    });

    expect(res.statusCode).toBe(404);
  });

  it('menolak pesan lebih dari 1000 karakter dengan 400', async () => {
    const kos = await createKos(pemilik);

    const res = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'a'.repeat(1001) });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/maksimal 1000 karakter/);
  });

  it('menolak pertanyaan kedua yang masih menunggu pada kos yang sama dengan 409', async () => {
    const kos = await createKos(pemilik);
    const pertama = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Pertama' });

    const res = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Kedua' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.data.inquiry_id).toBe(pertama.body.data._id);
    expect(await Inquiry.countDocuments()).toBe(1);
  });

  it('dua request bersamaan tetap hanya menyimpan satu pertanyaan', async () => {
    const kos = await createKos(pemilik);

    const hasil = await Promise.all([
      kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'A' }),
      kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'B' }),
    ]);

    expect(hasil.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await Inquiry.countDocuments()).toBe(1);
  });

  it('mengizinkan pertanyaan baru setelah pertanyaan sebelumnya dibalas', async () => {
    const kos = await createKos(pemilik);
    const pertama = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Pertama' });
    await Inquiry.findByIdAndUpdate(pertama.body.data._id, { status: 'dibalas', balasan: 'Ada' });

    const res = await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Kedua' });

    expect(res.statusCode).toBe(201);
  });

  it('pencari lain tetap bisa bertanya pada kos yang sama', async () => {
    const kos = await createKos(pemilik);
    const { token: tokenLain } = await createUser('pencari');
    await kirimInquiry(tokenPencari, { kos_id: kos._id, pesan: 'Saya dulu' });

    const res = await kirimInquiry(tokenLain, { kos_id: kos._id, pesan: 'Saya juga' });

    expect(res.statusCode).toBe(201);
  });
});

describe('PATCH /api/inquiries/:id/reply (balas pertanyaan)', () => {
  let pemilik;
  let tokenPemilik;
  let inquiry;

  beforeEach(async () => {
    ({ user: pemilik, token: tokenPemilik } = await createUser('pemilik'));
    const { user: pencari } = await createUser('pencari');
    const kos = await createKos(pemilik);
    inquiry = await Inquiry.create({
      pencari_id: pencari._id,
      pemilik_id: pemilik._id,
      kos_id: kos._id,
      pesan: 'Masih ada kamar?',
    });
  });

  it('pemilik bisa membalas pertanyaan untuk kosnya', async () => {
    const res = await balasInquiry(tokenPemilik, inquiry._id, 'Masih ada 2 kamar');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('dibalas');
    expect(res.body.data.balasan).toBe('Masih ada 2 kamar');
  });

  it('menolak mengubah balasan yang sudah terkirim dengan 400', async () => {
    await balasInquiry(tokenPemilik, inquiry._id, 'Balasan pertama');

    const res = await balasInquiry(tokenPemilik, inquiry._id, 'Balasan diubah');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect((await Inquiry.findById(inquiry._id)).balasan).toBe('Balasan pertama');
  });

  it('menolak balasan lebih dari 1000 karakter dengan 400', async () => {
    const res = await balasInquiry(tokenPemilik, inquiry._id, 'b'.repeat(1001));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/maksimal 1000 karakter/);
    expect((await Inquiry.findById(inquiry._id)).status).toBe('menunggu');
  });

  it('menolak pemilik lain dengan 403', async () => {
    const { token: tokenLain } = await createUser('pemilik');

    const res = await balasInquiry(tokenLain, inquiry._id, 'Bukan kos saya');

    expect(res.statusCode).toBe(403);
  });
});
