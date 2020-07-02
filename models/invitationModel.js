const crypto = require('crypto');
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      // expires in 12 hours
      default: Date.now() + 24 * 60 * 60 * 1000,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Encrypt token to help find
invitationSchema.pre(/^find/, function (next) {
  if (!this._conditions.token) next();

  const { token } = this._conditions;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  this._conditions.token = hashedToken;
  next();
});

// Filter out expired and not active invitations
invitationSchema.pre(/^find/, function (next) {
  this.find({ active: true, expiresAt: { $gt: Date.now() } });
  next();
});

invitationSchema.methods.deactivate = async function () {
  this.active = false;
  await this.save({ validateBeforeSave: false });
};

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
