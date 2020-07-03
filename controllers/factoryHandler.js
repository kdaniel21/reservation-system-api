const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

const noDocFound = (next) =>
  next(new AppError('No document was found with this ID.', 404));

// const noAccess = (next) =>
//   next(new AppError('No access to the selected document', 401));

exports.getOne = (Model, options) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    // Add options
    if (options) {
      if (options.populate) query = query.populate(options.populate);
      if (options.select) query = query.select(options.select);
    }

    const doc = await query;
    if (!doc) return noDocFound(next);

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return noDocFound(next);

    res.status(204).json({
      status: 'success',
      message: 'Document deleted successfully!',
      data: null,
    });
  });

exports.createOne = (Model, options) =>
  catchAsync(async (req, res, next) => {
    if (options) {
      if (options.addUser) req.body.user = req.user._id;
    }
    const newDoc = await Model.create([req.body], req.user);

    res.status(201).json({
      status: 'success',
      data: newDoc,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return noDocFound(next);

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model, options) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find({});
    let sortBy;

    // Additional options
    if (options) {
      if (options.queryCondition) query = query.find(options.queryCondition);
      if (options.populate) query = query.populate(options.populate);
      if (options.select) query = query.select(options.select);
      if (options.defaultSortBy) sortBy = options.defaultSortBy;
    }

    const features = new ApiFeatures(query, req.query, sortBy)
      .filter()
      .paginate()
      .limit()
      .sort();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      length: docs.length,
      data: docs,
    });
  });
