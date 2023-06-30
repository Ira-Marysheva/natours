const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bokinngController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bokinngController.crateBokingCheout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/signup', authController.isLoggedIn ,viewsController.getSignUp);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect,bokinngController.crateBokingCheout, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
