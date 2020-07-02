const express = require('express');
const authController = require('../controllers/authController');
const contactController = require('../controllers/contactController');
const Contact = require('../models/contactModel');

const router = express.Router();

router.use(
  authController.protect,
  authController.accessOnlyOwnDocument(Contact)
);

router.post('/', contactController.createContact);
router.get('/:id', contactController.getContact);
router
  .route('/:id/messages')
  .get(contactController.getMessages)
  .post(contactController.sendMessage);

router.use(authController.restrictTo('admin'));
router.get('/', contactController.getAllContacts);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
