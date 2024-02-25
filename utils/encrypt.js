const bcrypt = require('bcrypt');

async function calculateHash(value) {
  const saltRounds = 10; // Adjust this according to your security requirements
  const hashedValue = await bcrypt.hash(value, saltRounds);
  return hashedValue;
}

module.exports = {
  calculateHash
}
