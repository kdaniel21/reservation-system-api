const express = require('express');
const invitationController = require('../controllers/invitationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/:id', invitationController.getInvitation);

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .post(invitationController.createInvitation)
  .get(invitationController.getAllInvitations);

router.delete('/:id', invitationController.deleteInvitation);

module.exports = router;
