const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/jwt');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna yang terkait dengan token ini tidak ditemukan',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa',
      error: error.message,
    });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Abaikan error pada mode opsional
    }
  }

  next();
};

module.exports = { protect, optionalProtect };
