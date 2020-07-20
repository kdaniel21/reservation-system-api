const express = require('express');
const authController = require('../controllers/authController');
const contactController = require('../controllers/contactController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(contactController.createContact)
  .get(contactController.getContactsOfUser);

router.get(
  '/all',
  authController.restrictTo('admin'),
  contactController.getAllContacts
);

router
  .route('/:id')
  .get(contactController.getContact)
  .patch(contactController.markAsSolved, contactController.updateContact);

router
  .route('/:id/messages')
  .get(contactController.getMessages)
  .post(contactController.sendMessage);

router.use(authController.restrictTo('admin'));
router.delete('/:id', contactController.deleteContact);

module.exports = router;
