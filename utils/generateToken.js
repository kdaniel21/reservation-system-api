const crypto = require('crypto');

// Generates random token and returns it along the hashed version
module.exports = () => {
  // Generate random token
  const token = crypto.randomBytes(48).toString('hex');

  // Hash token using crypto
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return {
    token,
    hashedToken,
  };
};
