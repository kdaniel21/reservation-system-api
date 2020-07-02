const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Reservation = require('../models/reservationModel');

dotenv.config({ path: `${__dirname}/../config.env` });

mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testQuery = async () => {
  const startDate = new Date('2020-06-28 19:30');
  const endDate = new Date('2020-06-28 19:40');
  const place = {
    court: true,
    table: true,
  };
  console.log(startDate, endDate);

  const res = await Reservation.find({
    $and: [
      {
        $or: [
          {
            $and: [
              { startsAt: { $gte: startDate } },
              { startsAt: { $lte: endDate } },
            ],
          },
          { startsAt: { $lte: startDate }, endsAt: { $gte: startDate } },
        ],
      },
      {
        $or: [
          { $and: [{ 'place.court': place.court }, { 'place.court': true }] },
          { $and: [{ 'place.table': place.table }, { 'place.table': true }] },
        ],
      },
    ],
  });
  return res;
};

testQuery()
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
