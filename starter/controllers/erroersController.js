const AppError = require('../utils/appError');

const handleCasterrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!!', 401);
};

const handleJWTexpiredError = () => {
  return new AppError('You token has expired! Please log in again.', 401);
};

const handleDupliteFilds = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  //console.log('value: ', value);
  const message = `Duplicate field value: ${value}. Plese, use anouther value`;

  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  //A API
  if (req.originalUrl.startsWith('/api')) {
    // відправка помилки як json

    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      isoperational: err.isoperational,
    });
  } else {
    console.error('💥💥💥ERROR💥💥💥\n', err);
    //RENDER WEBSITE
    // render помилка(відображається у бразері сторка-пимилка)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input date. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendFrrorProd = (error, req, res) => {
  //Operational, trusted error: send message to the client
  // A API
  if (req.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      console.log('💚💚💚Production 1💚💚💚');
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
      //Programming or other unknown error: don`t leak details
    }
    //1)Log error
    console.log('🧡🧡🧡Development 1🧡🧡🧡');
    console.error('💥💥💥ERROR💥💥💥\n', error);
    //2)Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
  //B RENDER WEBSITE
  if (error.isOperational) {
    console.log('💚💚💚Production 2💚💚💚');
    return res.status(error.statusCode).render('error', {
      status: error.status,
      message: error.message,
    });
  }
  //Programming or other unknown error: don`t leak details
  //1)Log error
  console.log('🧡🧡🧡Development 2🧡🧡🧡');
  console.error('💥💥💥ERROR💥💥💥\n', error);
  //2)Send generic message
  return res.status(error.statusCode).render('error', {
    title: 'Something went very wrong',
    msg: 'Please try again later.',
  });
};

//CREATING HANDLING MIDDLEWARE(very simple)

module.exports = (err, req, res, next) => {
  // console.log('It is error', err.statusCode, err.message);
//   console.log('err.statusCode, err.message', err.statusCode, err.message);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //HARD COPU OF ERROR OBJECT
    //console.log('ERROR: ', '\n', err.name, '\n', err.message);
    // let error = { ...err };
    let error = Object.create(err);
    // console.log('It is error', error);
    if (err.name === 'CastError') error = handleCasterrorDB(err); //invalid id error
    if (err.code === 11000) error = handleDupliteFilds(err); //duplicate id error
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTexpiredError();
    sendFrrorProd(error, req, res);
  }
};
