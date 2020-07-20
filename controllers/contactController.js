const Contact = require('../models/contactModel');
const factoryHandler = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createContact = factoryHandler.createOne(Contact, {
  addUser: true,
});

exports.getContact = factoryHandler.getOne(Contact, {
  populate: { path: 'user', select: 'name' },
  select: '-messages',
});

exports.getMessages = factoryHandler.getOne(Contact, { select: 'messages' });

exports.getAllContacts = factoryHandler.getAll(Contact, {
  populate: { path: 'user', select: 'name email' },
});

exports.getContactsOfUser = catchAsync(async (req, res, next) => {
  const contacts = await Contact.find({ user: req.user }).populate({
    path: 'user',
    select: 'name email',
  });

  res.status(200).json({
    status: 'success',
    data: contacts,
  });
});

exports.deleteContact = factoryHandler.deleteOne(Contact);

exports.sendMessage = catchAsync(async (req, res, next) => {
  // Create message
  const msg = {
    message: req.body.message,
    user: { name: req.user.name, admin: req.user.role === 'admin' },
  };

  // Push to the messages array
  const message = await Contact.findByIdAndUpdate(
    req.params.id,
    {
      $push: { messages: msg },
    },
    { new: true, runValidators: true }
  );
  if (!message) return next(new AppError('Contact not found.', 404));

  res.status(200).json({
    status: 'success',
    message,
  });
});

exports.markAsSolved = (req, res, next) => {
  // Admins can update the whole doc
  if (req.user.role === 'admin') next();

  // Normal user can only update the solved property
  const numOfUpdates = Object.keys(req.body).length;
  if (!!req.body.closed && numOfUpdates === 1) next();

  res.status(401).json({
    status: 'fail',
    message: 'You are not allowed to modify this document.',
  });
};

exports.updateContact = factoryHandler.updateOne(Contact);
