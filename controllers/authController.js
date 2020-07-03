const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const Invitation = require('../models/invitationModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/sendEmail');

// HELPER FUNCTIONS
const signJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15 min' });
};

const loginUser = async (user, statusCode, res) => {
  // Create tokens
  const accessToken = signJWT({ id: user._id, role: user.role });
  const refreshToken = await user.generateRefreshToken();

  // Remove unwanted fields from the user
  const cleanedUser = { ...user.toObject() };
  delete cleanedUser.password;
  delete cleanedUser.updatedAt;
  delete cleanedUser.refreshTokens;

  res.status(statusCode).json({
    status: 'success',
    user: cleanedUser,
    accessToken,
    refreshToken,
  });
};

const sendUnauthorized = () => new AppError('Unauthorized', 401);

// EXPORTED FUNCTIONS
exports.register = catchAsync(async (req, res, next) => {
  // Validate invitation token
  const invitationToken = req.params.token;

  const invitation = await Invitation.findOne({ token: invitationToken });
  if (!invitation) return next(new AppError('Invitation not found.', 404));

  // Create new user
  const { password, passwordConfirm } = req.body;

  const newUser = await User.create({
    email: invitation.userEmail,
    name: invitation.userName,
    password,
    passwordConfirm,
    invitedBy: invitation.createdBy,
  });

  // Deactivate invitation
  await invitation.deactivate();

  // Log in user
  const { accessToken, refreshToken } = await loginUser(newUser);

  res.status(201).json({
    status: 'success',
    message: 'User created successfully!',
    accessToken,
    refreshToken,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    next(new AppError('Please provide an email and a password!', 400));

  // Get user
  const user = await User.findOne({ email }).select('+password');
  // Check password
  if (!user || !(await user.isPasswordValid(password, user.password)))
    next(new AppError('Invalid login credentials!', 401));

  // Log in user
  await loginUser(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if token was provided
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  )
    return next(sendUnauthorized());

  // Get token and verify
  const token = req.headers.authorization.split(' ')[1];
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) return next(sendUnauthorized());

  // Get corresponding user
  const user = await User.findById(decodedToken.id);
  if (!user) return next(sendUnauthorized());

  // User authorized
  req.user = user;
  next();
});

// Restrict route to certain user groups
exports.restrictTo = (...roles) => (req, res, next) => {
  return roles.includes(req.user.role) ? next() : next(sendUnauthorized());
};

exports.refreshToken = catchAsync(async (req, res, next) => {
  // Check if refreshToken and accessToken was provided
  const { refreshToken, accessToken } = req.body;
  if (!refreshToken || !accessToken)
    return next(
      new AppError('No refresh token or old access token was provided', 400)
    );

  // Decode old token
  const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET, {
    ignoreExpiration: true,
  });
  // Delete everything but the payload
  delete decodedAccessToken.iat;
  delete decodedAccessToken.exp;

  // Get all refresh token belonging to the user
  const user = await User.findById(decodedAccessToken.id).select(
    'refreshTokens'
  );

  // Validate refresh token
  const isRefreshTokenValid = await user.isRefreshTokenValid(
    refreshToken,
    user.refreshTokens
  );
  if (!isRefreshTokenValid)
    return next(new AppError('Refresh token not valid!', 401));

  // Create lastActive timestamp
  await user.markAsActive();

  // Create new access token with the same payload as the old one
  // Also replace the refresh token
  const newAccessToken = signJWT(decodedAccessToken);
  const newRefreshToken = await user.generateNewRefreshToken(
    refreshToken,
    user.refreshTokens
  );

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Get user based on email
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('Email address does not exist.', 400));

  // Generate and save token
  const token = await user.generatePasswordResetToken();

  // Send email
  await sendEmail.sendPasswordReset(user.email, user.name, token);

  res.status(200).json({
    status: 'success',
    message: 'Password reset email successfully sent!',
  });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.token;
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Get user
  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpiration: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Invalid password reset token!', 400));

  // Change password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiration = undefined;
  await user.save();

  // Log in user
  await loginUser(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get passwords from the body
  const { passwordCurrent, password, passwordConfirm } = req.body;

  // Get user
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.isPasswordValid(passwordCurrent, user.password)))
    return next(new AppError('Invalid password', 400));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully!',
  });
});

exports.accessOnlyFutureReservations = catchAsync(async (req, res, next) => {
  // Normal users can only see future reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (req.user.role !== 'admin') {
    // Only future (or own past) reservations
    req.query.$or = [{ startsAt: { gte: today } }, { user: req.user._id }];
    // Only active reservations
    req.query.active = { $ne: false };
  }
  next();
});

exports.accessOnlyOwnDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.user.role === 'admin') return next();

    const belongsTo = await Model.findById(req.params.id).select('user');
    if (belongsTo !== req.user._id)
      return next(new AppError('No access to the selected document.', 403));

    next();
  });
