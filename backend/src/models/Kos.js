const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const kosSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, 'Nama kos wajib diisi'],
      trim: true,
      maxlength: [120, 'Nama kos maksimal 120 karakter'],
    },
    deskripsi: {
      type: String,
      required: [true, 'Deskripsi kos wajib diisi'],
      trim: true,
    },
    alamat: {
      type: String,
      required: [true, 'Alamat lengkap kos wajib diisi'],
      trim: true,
    },
    area_kampus: {
      type: String,
      default: 'Sekitar UGM',
      trim: true,
    },
    koordinat: {
      latitude: {
        type: Number,
        required: [true, 'Latitude wajib diisi'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude wajib diisi'],
      },
    },
    foto: {
      type: [String],
      default: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      ],
    },
    harga_per_bulan: {
      type: Number,
      required: [true, 'Harga sewa per bulan wajib diisi'],
      min: [100000, 'Harga sewa minimal Rp 100.000'],
    },
    tipe: {
      type: String,
      enum: {
        values: ['putra', 'putri', 'campur'],
        message: 'Tipe kos harus salah satu dari: putra, putri, atau campur',
      },
      required: [true, 'Tipe kos wajib diisi'],
    },
    fasilitas: {
      type: [String],
      default: [],
    },
    luas_kamar: {
      type: String,
      default: '3x4 meter',
      trim: true,
    },
    peraturan: {
      type: [String],
      default: ['Akses 24 jam', 'Dilarang merokok di dalam kamar'],
    },
    jumlah_kamar_total: {
      type: Number,
      required: [true, 'Jumlah kamar total wajib diisi'],
      min: [1, 'Jumlah kamar total minimal 1'],
    },
    jumlah_kamar_tersedia: {
      type: Number,
      required: [true, 'Jumlah kamar tersedia wajib diisi'],
      min: [0, 'Jumlah kamar tersedia tidak boleh negatif'],
      validate: {
        validator: function (val) {
          return val <= this.jumlah_kamar_total;
        },
        message: 'Kamar tersedia tidak boleh melebihi jumlah kamar total',
      },
    },
    status_verifikasi: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status verifikasi harus pending, approved, atau rejected',
      },
      default: 'pending',
      index: true,
    },
    catatan_verifikasi: {
      type: String,
      default: '',
      trim: true,
    },
    diverifikasi_oleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    diverifikasi_pada: {
      type: Date,
      default: null,
    },
    pemilik_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID pemilik kos wajib diisi'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

kosSchema.index({ nama: 'text', deskripsi: 'text', alamat: 'text', area_kampus: 'text' });

// Saat satu kos dihapus (kos.deleteOne()), hapus juga data yang menunjuk ke kos tersebut.
// Model diambil lewat mongoose.model() di dalam hook supaya tidak terjadi circular require.
kosSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await Promise.all([
    mongoose.model('Favorit').deleteMany({ kos_id: this._id }),
    mongoose.model('Inquiry').deleteMany({ kos_id: this._id }),
  ]);
});

// Berkas foto lokal baru dihapus setelah kos benar-benar terhapus,
// supaya foto tidak hilang jika penghapusan kos gagal di tengah jalan.
kosSchema.post('deleteOne', { document: true, query: false }, async function () {
  const fotoLokal = (this.foto || []).filter(
    (foto) => typeof foto === 'string' && foto.startsWith('/uploads/')
  );

  await Promise.all(
    fotoLokal.map(async (foto) => {
      // basename() mencegah path seperti '/uploads/../.env' keluar dari folder uploads
      const filePath = path.join(UPLOAD_DIR, path.basename(foto));
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`[Kos] Gagal menghapus berkas foto ${filePath}: ${error.message}`);
        }
      }
    })
  );
});

module.exports = mongoose.model('Kos', kosSchema);
