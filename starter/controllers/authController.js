const bcrypt = require('bcrypt');
const crypto = require('crypto'); //package for do crypto operations
const { promisify } = require('util'); //use ES6 destructuring
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
//catchAsync it is use for dont write ever try|catch block
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { cli } = require('webpack-dev-server');

const createSentToken = async (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COKIE_EXPIRES_IN * 24 * 61 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.nextTick.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  const updateToken = await token;
  res.cookie('jwt', updateToken, cookieOptions);

  //Remove password from output
  user.password = undefined;

  //SENT NEW USER TO THE CLIENT
  res.status(statusCode).json({
    status: 'success',
    token: updateToken,
    data: {
      user,
    },
  });
};

const signToken = async (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, //it is paramener how long time
  });
};
//export conntroller
exports.signup = catchAsync(async (req, res, next) => {
  //create user a new document based on a model
  //for CREATE or SAVE
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSentToken(newUser, 201, res);
});

//loggin in users
exports.login = catchAsync(async (req, res, next) => {
  const { password, email } = req.body;
  //creating 2 wariables in body object

  //1)check if eamil and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!😫', 400));
  }
  //2)Check if user exists && pasword is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || (await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorect email or password🤬', 401));
  }

  //3)If everything ok, send token to client

  createSentToken(user, 200, res);
});

//Onle for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {  
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3)Check if user changed password after JWT the token was issued
      if (await currentUser.changedPasswordAfter(decoded.id)) {
        return next();
      }
      //THERE IS A LOOGED IN USER
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
    next();
  }
  next();
};
//LOG OUT THE USER
exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//PROTECTION TOUR ROUTER
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  console.log('You in protect middlevare')
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  //2)Validation token
  //async function
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3)Chek if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user token belonging to this user does no longer exist',
        401
      )
    );
  }

  //4)Check if user changed password after JWT the token was issued
  if (await currentUser.changedPasswordAfter(decoded.id)) {
    return next(
      new AppError(
        'User recently changed password! Please log in again!!!',
        401
      )
    );
  }
  //GRAND ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
//CHEK COREKT ROLE USER FOR WILL DO DELETE
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not permission to perform this action', 403)
      ); //forbidden
    }
    next();
  };
};

//PASSWORD RESET FUNCTIONALY
exports.fogotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on PASTTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  //2)Generate the random reset token
  const resetToken = await user.createPasswordResetToken();

  //deactivate all the validaters thet we specified in our schema
  await user.save({ validateBeforeSave: false });
  //3)Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot you password? Submit a PATCH request with you new password and passwordConfirm to: ${resetURL}. \nIf you didn't forget you password? please ignore this email`;
  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to email!  ',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  //token param we use from sright routers
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //find user in DB with this token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If toket has not expired? and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  user.changedPasswordAfter(hashedToken);

  // 4) Log the user in send JWT
  createSentToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection DB
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findBuIdAndUpdate will NOT work as instended

  // 4) Log user in,  send JWT
  createSentToken(user, 200, res);
});
