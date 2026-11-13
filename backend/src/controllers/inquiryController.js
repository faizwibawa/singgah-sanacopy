const Inquiry = require('../models/Inquiry');
const Kos = require('../models/Kos');

const PESAN_INQUIRY_DUPLIKAT =
  'Anda masih memiliki pertanyaan yang menunggu balasan untuk kos ini. Mohon tunggu balasan pemilik sebelum mengirim pertanyaan baru';

const sendInquiry = async (req, res, next) => {
  try {
    const { kos_id, pesan } = req.body;

    if (!kos_id || !pesan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon sertakan kos_id dan isi pesan pertanyaan',
      });
    }

    const kos = await Kos.findById(kos_id);
    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.status_verifikasi !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Kos belum disetujui untuk publik sehingga belum dapat ditanyakan',
      });
    }

    const existing = await Inquiry.findOne({
      pencari_id: req.user._id,
      kos_id,
      status: 'menunggu',
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: PESAN_INQUIRY_DUPLIKAT,
        data: { inquiry_id: existing._id },
      });
    }

    const inquiry = await Inquiry.create({
      pencari_id: req.user._id,
      pemilik_id: kos.pemilik_id,
      kos_id,
      pesan,
      status: 'menunggu',
    });

    res.status(201).json({
      success: true,
      message: 'Pesan pertanyaan berhasil dikirim ke pemilik kos',
      data: inquiry,
    });
  } catch (error) {
    // Dua request bersamaan bisa lolos findOne di atas; unique index di Inquiry.js menahannya
    if (error.code === 11000) {
      const existing = await Inquiry.findOne({
        pencari_id: req.user._id,
        kos_id: req.body.kos_id,
        status: 'menunggu',
      }).catch(() => null);
      return res.status(409).json({
        success: false,
        message: PESAN_INQUIRY_DUPLIKAT,
        data: existing ? { inquiry_id: existing._id } : undefined,
      });
    }
    next(error);
  }
};

const getMyInquiries = async (req, res, next) => {
  try {
    const listInquiry = await Inquiry.find({ pencari_id: req.user._id })
      .populate('kos_id', 'nama alamat foto harga_per_bulan tipe')
      .populate('pemilik_id', 'nama nomor_telepon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listInquiry.length,
      data: listInquiry,
    });
  } catch (error) {
    next(error);
  }
};

const getOwnerInquiries = async (req, res, next) => {
  try {
    const listInquiry = await Inquiry.find({ pemilik_id: req.user._id })
      .populate('kos_id', 'nama alamat')
      .populate('pencari_id', 'nama nomor_telepon email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listInquiry.length,
      data: listInquiry,
    });
  } catch (error) {
    next(error);
  }
};

const replyInquiry = async (req, res, next) => {
  try {
    const { balasan } = req.body;

    if (!balasan) {
      return res.status(400).json({
        success: false,
        message: 'Mohon masukkan teks balasan',
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    }

    if (inquiry.pemilik_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda bukan pemilik yang berhak membalas pesan ini',
      });
    }

    // Keputusan P1: balasan yang sudah terkirim tidak bisa diubah
    if (inquiry.status === 'dibalas') {
      return res.status(400).json({
        success: false,
        message: 'Pesan ini sudah dibalas sehingga balasan tidak dapat diubah lagi',
      });
    }

    inquiry.balasan = balasan;
    inquiry.status = 'dibalas';
    const updated = await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Balasan pesan berhasil dikirim',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInquiry,
  getMyInquiries,
  getOwnerInquiries,
  replyInquiry,
};
