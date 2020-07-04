/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const Reservation = require('../models/reservationModel');
const factoryHandler = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const isTimeAvailable = require('../utils/checkAvailability');
const AppError = require('../utils/appError');

const createReservationObject = (body, userId) => {
  return {
    name: body.name,
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
    user: userId,
    place: {
      table: body.place.table || false,
      court: body.place.court || false,
    },
  };
};

const cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

exports.getAllReservations = factoryHandler.getAll(Reservation, {
  select: '-createdAt -updatedAt',
});

exports.createReservation = catchAsync(async (req, res, next) => {
  // Validate time
  const isAvailable = await isTimeAvailable(req.body);
  if (!isAvailable) return next(new AppError('Time not available.', 400));

  // Create reservation
  const reservation = createReservationObject(req.body, req.user._id);

  const newReservation = await Reservation.create(reservation);

  res.status(201).json({
    status: 'success',
    data: newReservation,
  });
});

exports.getReservation = factoryHandler.getOne(Reservation, {
  populate: { path: 'user', select: 'name' },
});

exports.updateReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);

  // Revalidate if necessary
  if (req.body.startsAt || req.body.endsAt || req.body.place) {
    const startsAt = req.body.startsAt || reservation.startsAt;
    const endsAt = req.body.endsAt || reservation.endsAt;
    const place = req.body.place || reservation.place;

    const isAvailable = await isTimeAvailable({
      startsAt,
      endsAt,
      place,
      _id: req.params.id,
    });
    if (!isAvailable) return next('Time not available.', 400);
  }

  // Modify reservation
  Object.keys(req.body).forEach((key) => {
    reservation[key] = req.body[key];
  });
  await reservation.save();

  res.status(200).json({
    status: 'success',
    data: {
      data: reservation,
    },
  });
});

exports.deleteReservation = factoryHandler.deleteOne(Reservation);

exports.createRecurringReservation = catchAsync(async (req, res, next) => {
  // Create reservation with recurringId
  const reservation = createReservationObject(req.body, req.user._id);
  reservation.recurringId = mongoose.Types.ObjectId();

  const datesNotAvailable = [];
  const reservations = [];

  const originalYear = reservation.startsAt.getFullYear();
  while (reservation.startsAt.getFullYear() === originalYear) {
    const isAvailable = await isTimeAvailable(reservation);

    if (!isAvailable) {
      datesNotAvailable.push(new Date(reservation.startsAt));
    } else {
      // Create Reservation
      reservations.push(cloneObject(reservation));
    }

    reservation.startsAt.setDate(reservation.startsAt.getDate() + 7);
    reservation.endsAt.setDate(reservation.endsAt.getDate() + 7);
  }

  await Reservation.create(reservations);

  res.status(201).json({
    status: 'success',
    data: {
      datesNotAvailable,
    },
  });
});

exports.getAllRecurringReservations = factoryHandler.getAll(Reservation, {
  queryCondition: { recurringId: { $ne: undefined } },
  populate: { path: 'user', select: 'name' },
  defaultSortBy: 'startsAt',
});

// Expects a SINGLE reservation ID (and NOT a recurringId)
exports.updateRecurringReservation = catchAsync(async (req, res, next) => {
  // User tries to update a SINGLE reservation -> applies to every (future) instance of that
  // ID = id of the single reservation
  const selectedReservation = await Reservation.findById(req.params.id);
  const { recurringId } = selectedReservation;

  const modifiedReservation = { ...req.body };
  let datesNotAvailable;

  // Fields that require re-checking availability
  if (
    modifiedReservation.startsAt ||
    modifiedReservation.endsAt ||
    modifiedReservation.place
  ) {
    modifiedReservation.startsAt = modifiedReservation.startsAt
      ? new Date(modifiedReservation.startsAt)
      : selectedReservation.startsAt;
    modifiedReservation.endsAt = modifiedReservation.endsAt
      ? new Date(modifiedReservation.endsAt)
      : selectedReservation.endsAt;
    modifiedReservation.place =
      modifiedReservation.place || selectedReservation.place;

    // Get future instances
    const reservations = await Reservation.find({
      recurringId,
      startsAt: { $gte: selectedReservation.startsAt },
      active: true,
    });

    datesNotAvailable = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const reservation of reservations) {
      // Modify reservation
      Object.keys(modifiedReservation).forEach((key) => {
        if (['_id'].includes(key)) return; // list of properties that won't be copied
        reservation[key] = modifiedReservation[key];
      });

      // Check time availability
      const isAvailable = await isTimeAvailable(reservation);

      if (isAvailable) {
        await reservation.save();
      } else {
        datesNotAvailable.push(new Date(reservations.startsAt));
      }

      // Increment dates
      modifiedReservation.startsAt.setDate(
        modifiedReservation.startsAt.getDate() + 7
      );
      modifiedReservation.endsAt.setDate(
        modifiedReservation.endsAt.getDate() + 7
      );
    }
  } else {
    // If no need to revalidate simply update future instances
    await Reservation.updateMany(
      { recurringId, startsAt: { $gte: selectedReservation.startsAt } },
      req.body
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      datesNotAvailable,
    },
  });
});

// Expects a SINGLE reservation ID (and NOT a recurringId)
exports.deleteRecurringReservation = catchAsync(async (req, res, next) => {
  const selectedReservation = await Reservation.findById(req.params.id);
  const { recurringId } = selectedReservation;

  await Reservation.deleteMany({
    recurringId,
    startsAt: { $gte: selectedReservation.startsAt },
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Expects startsAt, endsAt, place, id?
exports.checkAvailability = catchAsync(async (req, res, next) => {
  const isAvailable = await isTimeAvailable(req.body);

  res.status(200).json({
    status: 'success',
    available: isAvailable,
  });
});
