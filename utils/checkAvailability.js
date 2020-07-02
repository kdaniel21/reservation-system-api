const Reservation = require('../models/reservationModel');

module.exports = async (reservation) => {
  const numOfReservations = await Reservation.find({
    $and: [
      {
        $or: [
          {
            $and: [
              { startsAt: { $gte: reservation.startsAt } },
              { startsAt: { $lte: reservation.endsAt } },
            ],
          },
          {
            startsAt: { $lte: reservation.startsAt },
            endsAt: { $gte: reservation.startsAt },
          },
        ],
      },
      {
        $or: [
          {
            $and: [
              { 'place.court': reservation.place.court },
              { 'place.court': true },
            ],
          },
          {
            $and: [
              { 'place.table': reservation.place.table },
              { 'place.table': true },
            ],
          },
        ],
      },
      { _id: { $ne: reservation._id } },
    ],
  }).countDocuments();

  return numOfReservations === 0;
};
