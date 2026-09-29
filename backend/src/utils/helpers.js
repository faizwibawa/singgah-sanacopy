/**
 * Utilitas bersama untuk keamanan input dan paginasi.
 */

// Escape karakter khusus regex agar input pengguna diperlakukan sebagai teks biasa
// (mencegah regex injection / ReDoS pada query $regex).
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Membatasi panjang kata kunci pencarian.
const safeSearchTerm = (str, maxLen = 100) => escapeRegex(String(str).trim().slice(0, maxLen));

// Paginasi aman: nilai non-numerik jatuh ke default, limit dibatasi maksimum.
const parsePagination = (page, limit, defaultLimit = 10, maxLimit = 100) => {
  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);
  if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;
  if (!Number.isFinite(limitNum) || limitNum < 1) limitNum = defaultLimit;
  if (limitNum > maxLimit) limitNum = maxLimit;
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

// Mengubah nilai menjadi angka, atau undefined jika tidak valid.
const toNumberOrUndefined = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
};

// Sel CSV yang aman: selalu dikutip, tanda kutip di-escape, dan diberi awalan
// apostrof bila diawali karakter formula (=, +, -, @, tab, CR) untuk mencegah CSV injection.
const csvCell = (val) => {
  let s = val === undefined || val === null ? '' : String(val);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

module.exports = { escapeRegex, safeSearchTerm, parsePagination, toNumberOrUndefined, csvCell };
