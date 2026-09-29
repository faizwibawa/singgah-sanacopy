const multer = require('multer');

const notFound = (req, res, next) => {
  const error = new Error(`Rute tidak ditemukan - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Format ID tidak valid: '${err.value}'`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Data duplikat: Nilai pada bidang '${field}' (${err.keyValue[field]}) sudah terdaftar.`;
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran berkas foto melebihi batas maksimal 5MB'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Jumlah foto melebihi batas maksimal (5 berkas) atau nama field tidak sesuai'
        : `Gagal mengunggah berkas: ${err.message}`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
