// Owner: Yasin Shafiei
// Requirements: FR1 (register, log in, change password), NFR Security (hashed passwords)
// What it does: hashes passwords with crypto.scrypt and a random salt, and checks them.
// We never store the real password, only "salt:hash" (both in hex).

const crypto = require('crypto');

// Returns "salt:hash" for a new password.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex'); // 16 random bytes, different for every user
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

// Returns true if the password matches the stored "salt:hash".
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;

  const storedHash = Buffer.from(hash, 'hex');
  const newHash = crypto.scryptSync(password, salt, 64); // same salt, so the same password gives the same hash

  // timingSafeEqual takes the same time whether the first or the last byte differs,
  // so an attacker cannot guess the hash by timing the answer.
  return storedHash.length === newHash.length && crypto.timingSafeEqual(storedHash, newHash);
}

module.exports = { hashPassword, verifyPassword };
