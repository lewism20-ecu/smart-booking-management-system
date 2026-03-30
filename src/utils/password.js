const bcrypt = require("bcrypt");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
