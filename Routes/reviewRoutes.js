const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authenticationController');

const router = express.Router({ mergeParams: true });
// Here mergeParams is used, so that we can get access to :tourId params
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );
// .post(
//   //   authController.restrictTo('user'),
//   reviewController.setTourUserId,
//   reviewController.createReview
// );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
