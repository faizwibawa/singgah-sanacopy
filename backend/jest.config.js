module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  // Dijalankan di setiap file test: menyalakan MongoDB in-memory & membersihkan data
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Download binary MongoDB pertama kali bisa lama, jadi beri waktu lebih
  testTimeout: 30000,
};
