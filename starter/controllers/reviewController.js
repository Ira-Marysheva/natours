//розробити точку для створення нових відгуків
//розробити точку для щтримання вісх відгуків
//створити функції контроллера
//створити маршрут у файлі маршрутів Get all reviews
//створити декілька відгуків

//const catchAsync = require('..//utils/catchAsync');
//const AppError = require('./erroersController');
const Review = require('.././models/ReviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId; //get data from URL
  if (!req.body.user) req.body.user = req.params.id; //get data from URL
  next();
};

exports.createNewReview = factory.createOne(Review);
exports.updareReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
