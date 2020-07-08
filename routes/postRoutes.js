const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/', postController.getAllPublicPosts);
router.get(
  '/all',
  authController.restrictTo('admin'),
  postController.getAllPosts
);
router.get('/:slug', postController.getPost);

router.use(authController.restrictTo('admin'));

router.post('/', postController.addAuthor, postController.createPost);
router.get('/all', postController.getAllPosts);
router
  .route('/edit/:id')
  .get(postController.getPostDetails)
  .delete(postController.deletePost)
  .patch(postController.updatePost);

module.exports = router;
