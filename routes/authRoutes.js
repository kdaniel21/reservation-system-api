const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/register/:token', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post(
  '/update-password',
  authController.protect,
  authController.updatePassword
);

module.exports = router;
