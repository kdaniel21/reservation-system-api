const Post = require('../models/postModel');
const factoryHandler = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Default populate options
const populate = { path: 'author', select: 'name photo' };

exports.getAllPublicPosts = factoryHandler.getAll(Post, {
  queryCondition: {
    public: true,
    publicAt: { $lte: Date.now() },
  },
  populate,
  defaultSortBy: '-publicAt',
});

exports.getAllPosts = factoryHandler.getAll(Post, { populate });

// exports.getPost = factoryHandler.getOne(Post, { queryOn: ['slug'] });
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({
    slug: req.params.slug,
    public: true,
    publicAt: { $lte: Date.now() },
  }).populate(populate);

  if (!post) return next(new AppError('Post not found!', 404));

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

exports.getPostDetails = factoryHandler.getOne(Post, { populate });

exports.createPost = factoryHandler.createOne(Post, { addUser: true });

exports.deletePost = factoryHandler.deleteOne(Post);

exports.updatePost = factoryHandler.updateOne(Post);

exports.addAuthor = (req, res, next) => {
  req.body.author = req.user._id;
  next();
};
