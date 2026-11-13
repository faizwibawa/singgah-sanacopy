const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    pencari_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pemilik_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kos_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kos',
      required: true,
      index: true,
    },
    pesan: {
      type: String,
      required: [true, 'Pesan pertanyaan wajib diisi'],
      trim: true,
      maxlength: [1000, 'Pesan pertanyaan maksimal 1000 karakter'],
    },
    balasan: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Balasan maksimal 1000 karakter'],
    },
    status: {
      type: String,
      enum: ['menunggu', 'dibalas'],
      default: 'menunggu',
    },
  },
  {
    timestamps: true,
  }
);

// Satu pencari hanya boleh punya satu inquiry 'menunggu' per kos.
// Pengecekan utama ada di controller (409); index ini menjaga dari request yang masuk bersamaan.
inquirySchema.index(
  { pencari_id: 1, kos_id: 1 },
  { unique: true, partialFilterExpression: { status: 'menunggu' } }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
