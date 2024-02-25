const bcrypt = require('bcrypt');

async function calculateHash(value) {
  const saltRounds = 10; // Adjust this according to your security requirements
  const hashedValue = await bcrypt.hash(value, saltRounds);
  return hashedValue;
}
async function verifyHash(hashedValue, plainText) {
  return await bcrypt.compare(plainText, hashedValue);
}

module.exports = {
  calculateHash,
  verifyHash,
}
