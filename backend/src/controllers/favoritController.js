const Favorit = require('../models/Favorit');
const Kos = require('../models/Kos');

const getMyFavorites = async (req, res, next) => {
  try {
    const semuaFavorit = await Favorit.find({ user_id: req.user._id })
      .populate({
        path: 'kos_id',
        populate: {
          path: 'pemilik_id',
          select: 'nama nomor_telepon email',
        },
      })
      .sort({ createdAt: -1 });

    // Jaring pengaman: lewati favorit yang kos-nya sudah tidak ada
    const listFavorit = semuaFavorit.filter((favorit) => favorit.kos_id);

    res.status(200).json({
      success: true,
      count: listFavorit.length,
      data: listFavorit,
    });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { kosId } = req.params;

    const kos = await Kos.findById(kosId);
    if (!kos) {
      return res.status(404).json({ success: false, message: 'Kos tidak ditemukan' });
    }

    if (kos.status_verifikasi !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Kos belum disetujui untuk publik sehingga belum dapat difavoritkan',
      });
    }

    const existing = await Favorit.findOne({ user_id: req.user._id, kos_id: kosId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Kos sudah ada di dalam daftar favorit Anda',
      });
    }

    const favorit = await Favorit.create({
      user_id: req.user._id,
      kos_id: kosId,
    });

    res.status(201).json({
      success: true,
      message: 'Kos berhasil ditambahkan ke daftar favorit',
      data: favorit,
    });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { kosId } = req.params;

    const favorit = await Favorit.findOneAndDelete({
      user_id: req.user._id,
      kos_id: kosId,
    });

    if (!favorit) {
      return res.status(404).json({
        success: false,
        message: 'Kos tidak ditemukan di dalam daftar favorit Anda',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kos berhasil dihapus dari daftar favorit',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyFavorites, addFavorite, removeFavorite };
