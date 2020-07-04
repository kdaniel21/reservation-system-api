const express = require('express');
const reservationController = require('../controllers/reservationController');
const authController = require('../controllers/authController');
const Reservation = require('../models/reservationModel');

const router = express.Router();

router.use(authController.protect, authController.accessOnlyFutureReservations);

router
  .route('/')
  .get(reservationController.getAllReservations)
  .post(reservationController.createReservation);

router.post('/available', reservationController.checkAvailability);

router
  .route('/recurring')
  .post(reservationController.createRecurringReservation)
  .get(reservationController.getAllRecurringReservations);

router.use(authController.accessOnlyOwnDocument(Reservation));
router
  .route('/:id')
  .get(reservationController.getReservation)
  .patch(reservationController.updateReservation)
  .delete(
    authController.restrictTo('admin'),
    reservationController.deleteReservation
  );

router
  .route('/recurring/:id')
  .patch(reservationController.updateRecurringReservation)
  .delete(reservationController.deleteRecurringReservation);

module.exports = router;
