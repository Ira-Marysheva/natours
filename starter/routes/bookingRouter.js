const express = require('express');
const bokingController = require('.././controllers/bookingController');
const authController = require('.././controllers/authController');

const router = express.Router();
router.use(authController.protect);
router.get('/checkout-session/:tourId', bokingController.getCheckOutSessing);

router.use(authController.restrictTo('lead-guide', 'admin'));

router
  .route('/')
  .get(bokingController.getAllBookings)
  .post(bokingController.createBooking);

router
  .route('/:id')
  .get(bokingController.getBooking)
  .patch(bokingController.updateBooking)
  .delete(bokingController.deleteBooking);

module.exports = router;
