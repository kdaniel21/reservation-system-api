const crypto = require('crypto');

// Generates random token and returns it along the hashed version
module.exports = (length = 48) => {
  // Generate random token
  const token = crypto.randomBytes(length).toString('hex');

  // Hash token using crypto
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return {
    token,
    hashedToken,
  };
};
