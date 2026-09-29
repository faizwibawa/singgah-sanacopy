/**
 * Mengambil secret JWT dari environment. Tidak ada nilai cadangan (fallback):
 * secret yang tertulis di kode sumber memungkinkan siapa pun memalsukan token admin.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum diatur. Salin backend/.env.example menjadi backend/.env dan isi JWT_SECRET.');
  }
  return secret;
};

module.exports = { getJwtSecret };
