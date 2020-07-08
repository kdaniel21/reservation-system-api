const express = require('express');
const authController = require('../controllers/authController');
const contactController = require('../controllers/contactController');
const Contact = require('../models/contactModel');

const router = express.Router();

router.use(
  authController.protect,
  authController.accessOnlyOwnDocument(Contact)
);

router
  .route('/')
  .post(contactController.createContact)
  .get(contactController.getAllContacts);

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
