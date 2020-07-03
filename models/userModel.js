const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const generateToken = require('../utils/generateToken');

const refreshTokenSchema = mongoose.Schema({
  token: String,
  expiration: Date,
  // TODO: add browser info
});
const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: 'A valid email address must be provided',
      },
    },
    name: {
      type: String,
    },
    photo: String,
    password: {
      type: String,
      select: false,
      required: true,
      validate: {
        validator: function (val) {
          return val === this.passwordConfirm;
        },
        message: 'Your passwords do not match!',
      },
    },
    passwordConfirm: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    invitedBy: {
      type: mongoose.Types.ObjectId,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiration: {
      type: Date,
      select: false,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      select: false,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();

  // Hash password and not store passwordConfirm
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// Hide __v field from queries
userSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

// Filter out not active users
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

// Validate if password is correct
userSchema.methods.isPasswordValid = function (inputPassword, hashedPassword) {
  return bcrypt.compare(inputPassword, hashedPassword);
};

// Validate refresh token
userSchema.methods.isRefreshTokenValid = function (
  inputRefreshToken,
  hashedRefreshTokens
) {
  const hashedInputToken = crypto
    .createHash('sha256')
    .update(inputRefreshToken)
    .digest('hex');

  const isRefreshTokenValid = hashedRefreshTokens.some(
    (tokenObj) =>
      tokenObj.token === hashedInputToken &&
      new Date(tokenObj.expiration).getTime() > Date.now()
  );

  return isRefreshTokenValid;
};

// Replace existing refresh token with a new one
userSchema.methods.generateNewRefreshToken = async function (
  currRefreshToken,
  refreshTokens
) {
  const hashedCurrToken = crypto
    .createHash('sha256')
    .update(currRefreshToken)
    .digest('hex');

  // Generate new refresh token
  const { token, hashedToken } = generateToken();

  const index = refreshTokens.findIndex(
    (tokenObj) => tokenObj.token === hashedCurrToken
  );

  // Change token & save
  refreshTokens[index].token = hashedToken;

  this.refreshTokens = refreshTokens;
  await this.save({ validateBeforeSave: false });

  return token;
};

// Create new refresh token
userSchema.methods.generateRefreshToken = async function () {
  // Generate refresh token
  const { token, hashedToken } = generateToken();

  // Create refreshToken object with 1 month validity
  const refreshToken = {
    token: hashedToken,
    expiration: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  // Save hashed refresh token to the DB
  if (!this.refreshTokens) this.refreshTokens = [];

  this.refreshTokens.push(refreshToken);
  this.save({ validateBeforeSave: false });

  return token;
};

userSchema.methods.generatePasswordResetToken = async function () {
  // Generate token
  const { token, hashedToken } = generateToken();

  // Save token
  this.passwordResetToken = hashedToken;
  // token valid only for 30 minutes
  this.passwordResetExpiration = new Date(Date.now() + 30 * 60 * 60 * 1000);
  await this.save({ validateBeforeSave: false });

  return token;
};

userSchema.methods.markAsActive = function () {
  this.lastActiveAt = Date.now();
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
