const Invitation = require('../models/invitationModel');
const catchAsync = require('../utils/catchAsync');
const generateToken = require('../utils/generateToken');
const factoryHandler = require('./factoryHandler');

const sendEmail = require('../utils/sendEmail');

exports.createInvitation = catchAsync(async (req, res, next) => {
  // Create invitation
  const { token, hashedToken } = generateToken();
  const invitation = {
    userName: req.body.name,
    userEmail: req.body.email,
    createdBy: req.user._id,
    token: hashedToken,
  };

  const newInvitation = await Invitation.create(invitation);

  // Send email to the user
  await sendEmail.sendInvitation(
    newInvitation.userEmail,
    newInvitation.userName,
    token
  );

  res.status(200).json({
    status: 'success',
    message: 'Invitation created and sent to the user.',
  });
});

exports.getInvitation = factoryHandler.getOne(Invitation);

exports.getAllInvitations = factoryHandler.getAll(Invitation);

exports.deleteInvitation = factoryHandler.deleteOne(Invitation);
