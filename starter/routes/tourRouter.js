const express = require('express');
const tourController = require('./../controllers/tourController');
const router = express.Router();
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRouter');

// Nested route
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createNewReview
//   );

//emounting router(work as middleware function)
router.use('/:tourId/reviews', reviewRouter);

//it is mini-sub-application that work whith the routes
// router.param('id', tourController.checkID);

//we can use catchAsync function for all async function here
//ex::::.get(catchAsync( tourController.aliasTopTours
//but it is not correct because we at this moment we have only async function

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan
  );
//таке вказання параметнів у URL рядку є більш чистішим та стандартнішим способом вказання даних, чим прописування всіх параметрів окремо в тілі запиту
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
//tours-within?distance=233&center=-40,45&unit=mi
//tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTours
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
