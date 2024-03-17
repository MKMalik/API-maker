const bcrypt = require("bcrypt-nodejs");
const { promisify } = require("util");

// Promisify bcrypt functions
const hashAsync = promisify(bcrypt.hash);
const compareAsync = promisify(bcrypt.compare);

async function calculateHash(value) {
  const saltRounds = 10; // Adjust this according to your security requirements
  const hashedValue = await hashAsync(value, null, null);
  return hashedValue;
}

async function verifyHash(hashedValue, plainText) {
  return await compareAsync(plainText, hashedValue);
}

module.exports = {
  calculateHash,
  verifyHash,
};

