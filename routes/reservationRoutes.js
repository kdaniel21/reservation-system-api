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

router.get('/current', reservationController.getCurrentReservation);
router.post('/available', reservationController.checkAvailability);

router
  .route('/recurring')
  .post(reservationController.createRecurringReservation)
  .get(reservationController.getAllRecurringReservations);

router
  .route('/:id', authController.accessOnlyOwnDocument(Reservation))
  .get(reservationController.getReservation)
  .patch(reservationController.updateReservation)
  .delete(
    authController.restrictTo('admin'),
    reservationController.deleteReservation
  );

router
  .route('/recurring/:id', authController.accessOnlyOwnDocument(Reservation))
  .patch(reservationController.updateRecurringReservation)
  .delete(reservationController.deleteRecurringReservation);

module.exports = router;
