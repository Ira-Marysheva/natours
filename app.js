const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitaze = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./starter/utils/appError');
const globalErrorHandler = require('./starter/controllers/erroersController');
const tourRouter = require('./starter/routes/tourRouter');
const userRouter = require('./starter/routes/userRoutes');
const reviewRouter = require('./starter/routes/reviewRouter');
const bookingRouter = require('./starter/routes/bookingRouter');
const viewRouter = require('./starter/routes/viewRoutes');
const app = express();

//Path engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'starter/views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'starter/public')));

//1)GLOBAL MIDDLEWARE
//Set security HTTP handlers
app.use(helmet());

//Development loggin
//console.log(process.env.NODE_ENV); // sinple show undefined
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many request from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//open simple middlevere
app.use(express.json({ limit: '10kb' })); // first parse data from body
app.use(cookieParser()); // after that parse data from  cookie

//DATA SANITIZATION againts NoQL query injection
app.use(mongoSanitaze());

//DATA SANITIZATION AGAINST XSS
app.use(xss());

//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuatity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  //toISOString it is method for redable string for us
  req.requesTime = new Date().toISOString();
  // console.log('it is cooke from app.js', req.cookies); //show all cookies in the console
  next();
});

//2)ROUTE HANDLERS

//3)ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//HANDLER FOR UNDEFINED ROUTES
app.all('*', (req, res, next) => {
  // const err = new Error("Can't find ${req.originalUrl} on this server!");
  // err.status = 'fail';
  // err.StatusCode = 400;
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;