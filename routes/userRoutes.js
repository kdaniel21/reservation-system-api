const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
// USER ROUTES
router.use(authController.protect);
router
  .route('/me')
  .get(userController.selectCurrentUser, userController.getUser)
  .patch(userController.selectCurrentUser, userController.updateUser);

// USER HANDLING ROUTES FOR ADMINS
router.use(authController.restrictTo('admin'));

router.get('/', userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser);

module.exports = router;
