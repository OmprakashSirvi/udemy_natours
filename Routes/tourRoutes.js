const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authenticationController');
const reviewRoutes = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRoutes);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-paln/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'tour-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// router.param('id', tourController.checkId);
// app.get('/api/v1/tours', getAllTours);
// Post request
// app.post('/api/v1/tours', createTour);
// Alternative for above two lines ..
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'tour-guide'),
    tourController.createTour
  );
// Get a tour
// app.get('/api/v1/tours/:id', getATour);
// Patch request..
// tourRoute.patch('/:id', patchTour);
// This same alternative can be done for above two lines ..
router
  .route('/:id')
  .get(tourController.getATour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.patchTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// Review Routes

//
module.exports = router;
