const Invitation = require('../models/invitationModel');
const catchAsync = require('../utils/catchAsync');
const generateToken = require('../utils/generateToken');
const factoryHandler = require('./factoryHandler');

const Email = require('../utils/sendEmail');
const AppError = require('../utils/appError');

exports.createInvitation = catchAsync(async (req, res, next) => {
  // Create invitation
  const { token, hashedToken } = generateToken(20);
  const invitation = {
    userName: req.body.name,
    userEmail: req.body.email,
    createdBy: req.user._id,
    token: hashedToken,
  };

  await Invitation.create(invitation);

  await new Email(req.body, `${process.env.SITE_URL}/auth/register/${token}`, {
    invitedBy: req.user.name,
  }).sendInvitationMail();

  res.status(200).json({
    status: 'success',
    message: 'Invitation created and sent to the user.',
  });
});

// exports.getInvitation = factoryHandler.getOne(Invitation);
exports.getInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const invitation = await Invitation.findOne({ token });
  if (!invitation) return next(new AppError('Invitation not found.', 404));

  // Resend the decrypted token (that was already sent)
  invitation.token = token;

  res.status(200).json({
    status: 'success',
    data: invitation,
  });
});

exports.getAllInvitations = factoryHandler.getAll(Invitation);

exports.deleteInvitation = factoryHandler.deleteOne(Invitation);
