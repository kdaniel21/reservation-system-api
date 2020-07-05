const factoryHandler = require('./factoryHandler');
// const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

exports.selectCurrentUser = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.getUser = factoryHandler.getOne(User);
exports.updateUser = factoryHandler.updateOne(User);
exports.getAllUsers = factoryHandler.getAll(User, {
  populate: { path: 'invitedBy', select: 'name' },
});
