const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  table: { type: Boolean, default: false, required: true },
  court: { type: Boolean, default: false, required: true },
});

const reservationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (val) {
          return val > this.startsAt;
        },
        message: () => 'The cannot have a negative length.',
      },
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    place: {
      type: placeSchema,
      validate: {
        validator: function (val) {
          return val.table || val.court;
        },
        message: () => 'At least one place must be reserved.',
      },
    },
    recurringId: mongoose.Types.ObjectId,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reservationSchema.index({ startsAt: 1, endsAt: 1, place: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
