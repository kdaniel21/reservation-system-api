const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: String,
    lead: String,
    text: String,
    slug: String,
    public: { type: Boolean, default: false },
    publicAt: Date,
    author: { type: mongoose.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
