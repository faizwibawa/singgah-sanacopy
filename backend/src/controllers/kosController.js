const Kos = require('../models/Kos');
const Favorit = require('../models/Favorit');
const Inquiry = require('../models/Inquiry');
const {
  safeSearchTerm,
  escapeRegex,
  parsePagination,
  toNumberOrUndefined,
} = require('../utils/helpers');

// Field yang bila diubah pemilik pada kos yang sudah disetujui/ditolak
// mengharuskan verifikasi ulang oleh admin. Perubahan kuota kamar tidak termasuk,
// agar pemilik tetap bisa memperbarui ketersediaan kamar secara real-time.
const FIELD_BUTUH_VERIFIKASI_ULANG = [
  'nama', 'deskripsi', 'alamat', 'area_kampus', 'koordinat', 'harga_per_bulan',
  'tipe', 'fasilitas', 'luas_kamar', 'peraturan', 'jumlah_kamar_total',
];

const getAllKosPublic = async (req, res, next) => {
  try {
    const {
      q,
      tipe,
      harga_min,
      harga_max,
      fasilitas,
      kamar_tersedia,
      area_kampus,
      sort,
      page,
      limit,
    } = req.query;

    const filter = { status_verifikasi: 'approved' };

    if (q) {
      const term = safeSearchTerm(q);
      filter.$or = [
        { nama: { $regex: term, $options: 'i' } },
        { alamat: { $regex: term, $options: 'i' } },
        { area_kampus: { $regex: term, $options: 'i' } },
        { deskripsi: { $regex: term, $options: 'i' } },
      ];
    }

    if (tipe) {
      filter.tipe = String(tipe).toLowerCase();
    }

    if (area_kampus) {
      filter.area_kampus = { $regex: safeSearchTerm(area_kampus), $options: 'i' };
    }

    const hargaMin = toNumberOrUndefined(harga_min);
    const hargaMax = toNumberOrUndefined(harga_max);
    if (hargaMin !== undefined || hargaMax !== undefined) {
      filter.harga_per_bulan = {};
      if (hargaMin !== undefined) filter.harga_per_bulan.$gte = hargaMin;
      if (hargaMax !== undefined) filter.harga_per_bulan.$lte = hargaMax;
    }

    if (kamar_tersedia === 'true') {
      filter.jumlah_kamar_tersedia = { $gt: 0 };
    }

    if (fasilitas) {
      const fasList = String(fasilitas)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((f) => new RegExp(escapeRegex(f.slice(0, 50)), 'i'));
      if (fasList.length > 0) filter.fasilitas = { $all: fasList };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'harga_asc') sortOptions = { harga_per_bulan: 1 };
    if (sort === 'harga_desc') sortOptions = { harga_per_bulan: -1 };
    if (sort === 'kamar_banyak') sortOptions = { jumlah_kamar_tersedia: -1 };

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 10);

    const totalData = await Kos.countDocuments(filter);
    const dataKos = await Kos.find(filter)
      .populate('pemilik_id', 'nama nomor_telepon email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: dataKos.length,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      data: dataKos,
    });
  } catch (error) {
    next(error);
  }
};

const getKosById = async (req, res, next) => {
  try {
    const kos = await Kos.findById(req.params.id).populate(
      'pemilik_id',
      'nama nomor_telepon email foto_profil'
    );

    if (!kos) {
      return res.status(404).json({
        success: false,
        message: 'Kos tidak ditemukan',
      });
    }

    if (kos.status_verifikasi !== 'approved') {
      const user = req.user;
      const isOwner =
        user && kos.pemilik_id && kos.pemilik_id._id.toString() === user._id.toString();
      const isAdmin = user && user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Kos ini masih dalam proses peninjauan verifikasi admin dan belum dipublikasikan.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: kos,
    });
  } catch (error) {
    next(error);
  }
};

const createKos = async (req, res, next) => {
  try {
    const {
      nama,
      deskripsi,
      alamat,
      area_kampus,
      latitude,
      longitude,
      harga_per_bulan,
      tipe,
      fasilitas,
      luas_kamar,
      peraturan,
      jumlah_kamar_total,
      jumlah_kamar_tersedia,
      foto_urls,
    } = req.body;

    if (!nama || !deskripsi || !alamat || !harga_per_bulan || !tipe || !jumlah_kamar_total) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi field wajib: nama, deskripsi, alamat, harga_per_bulan, tipe, jumlah_kamar_total',
      });
    }

    let daftarFoto = [];
    if (req.files && req.files.length > 0) {
      daftarFoto = req.files.map((file) => `/uploads/${file.filename}`);
    } else if (foto_urls) {
      daftarFoto = Array.isArray(foto_urls) ? foto_urls : [foto_urls];
    } else {
      daftarFoto = [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      ];
    }

    let parsedFasilitas = [];
    if (fasilitas) {
      parsedFasilitas = Array.isArray(fasilitas) ? fasilitas : fasilitas.split(',').map((f) => f.trim());
    }

    let parsedPeraturan = ['Akses 24 Jam', 'Dilarang Merokok di Kamar'];
    if (peraturan) {
      parsedPeraturan = Array.isArray(peraturan) ? peraturan : peraturan.split(',').map((p) => p.trim());
    }

    const kosBaru = await Kos.create({
      nama,
      deskripsi,
      alamat,
      area_kampus: area_kampus || 'Sekitar UGM',
      koordinat: {
        latitude: Number(latitude) || -7.7681,
        longitude: Number(longitude) || 110.3779,
      },
      foto: daftarFoto,
      harga_per_bulan: Number(harga_per_bulan),
      tipe: tipe.toLowerCase(),
      fasilitas: parsedFasilitas,
      luas_kamar: luas_kamar || '3x4 meter',
      peraturan: parsedPeraturan,
      jumlah_kamar_total: Number(jumlah_kamar_total),
      jumlah_kamar_tersedia:
        jumlah_kamar_tersedia !== undefined
          ? Number(jumlah_kamar_tersedia)
          : Number(jumlah_kamar_total),
      status_verifikasi: 'pending',
      pemilik_id: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Kos berhasil didaftarkan dan sedang menunggu verifikasi oleh Administrator',
      data: kosBaru,
    });
  } catch (error) {
    next(error);
  }
};

const getMyKos = async (req, res, next) => {
  try {
    const listKos = await Kos.find({ pemilik_id: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listKos.length,
      data: listKos,
    });
  } catch (error) {
    next(error);
  }
};

const updateKos = async (req, res, next) => {
  try {
    let kos = await Kos.findById(req.params.id);

    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.pemilik_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda hanya dapat memperbarui kos milik Anda sendiri',
      });
    }

    const {
      nama,
      deskripsi,
      alamat,
      area_kampus,
      latitude,
      longitude,
      harga_per_bulan,
      tipe,
      fasilitas,
      luas_kamar,
      peraturan,
      jumlah_kamar_total,
      jumlah_kamar_tersedia,
    } = req.body;

    if (nama) kos.nama = nama;
    if (deskripsi) kos.deskripsi = deskripsi;
    if (alamat) kos.alamat = alamat;
    if (area_kampus) kos.area_kampus = area_kampus;
    if (latitude && longitude) {
      kos.koordinat = { latitude: Number(latitude), longitude: Number(longitude) };
    }
    if (harga_per_bulan) kos.harga_per_bulan = Number(harga_per_bulan);
    if (tipe) kos.tipe = tipe.toLowerCase();
    if (luas_kamar) kos.luas_kamar = luas_kamar;
    if (fasilitas) {
      kos.fasilitas = Array.isArray(fasilitas) ? fasilitas : fasilitas.split(',').map((f) => f.trim());
    }
    if (peraturan) {
      kos.peraturan = Array.isArray(peraturan) ? peraturan : peraturan.split(',').map((p) => p.trim());
    }
    if (jumlah_kamar_total !== undefined) kos.jumlah_kamar_total = Number(jumlah_kamar_total);
    if (jumlah_kamar_tersedia !== undefined) {
      kos.jumlah_kamar_tersedia = Number(jumlah_kamar_tersedia);
    }

    // Pemilik mengubah data penting pada kos yang sudah diverifikasi -> kembali ke antrean verifikasi
    let butuhVerifikasiUlang = false;
    if (req.user.role !== 'admin' && kos.status_verifikasi !== 'pending') {
      butuhVerifikasiUlang = FIELD_BUTUH_VERIFIKASI_ULANG.some((f) => kos.isModified(f));
      if (butuhVerifikasiUlang) {
        kos.status_verifikasi = 'pending';
        kos.catatan_verifikasi = 'Data kos diperbarui oleh pemilik dan menunggu verifikasi ulang admin.';
        kos.diverifikasi_oleh = null;
        kos.diverifikasi_pada = null;
      }
    }

    const updatedKos = await kos.save();

    res.status(200).json({
      success: true,
      message: butuhVerifikasiUlang
        ? 'Data kos berhasil diperbarui dan akan ditinjau ulang oleh Administrator sebelum tayang kembali'
        : 'Data kos berhasil diperbarui',
      data: updatedKos,
    });
  } catch (error) {
    next(error);
  }
};

const deleteKos = async (req, res, next) => {
  try {
    const kos = await Kos.findById(req.params.id);

    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.pemilik_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus kos ini',
      });
    }

    await Promise.all([
      Favorit.deleteMany({ kos_id: kos._id }),
      Inquiry.deleteMany({ kos_id: kos._id }),
    ]);
    await kos.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Kos berhasil dihapus dari sistem',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllKosPublic,
  getKosById,
  createKos,
  getMyKos,
  updateKos,
  deleteKos,
};
