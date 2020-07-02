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
  populate: { path: 'user', select: 'name' },
  select: '-messages',
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
    // {
    //   messages: { $push: msg },
    // },
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
