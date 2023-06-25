const multer = require('multer');
// const fs = require('fs');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// multer storage
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'starter/public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage(); // save in the buffer

//multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//configurete so-called multer upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

//resizin photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //image resizing
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`starter/public/img/users/${req.file.filename}`);

  next();
});

//Standart Js code
const filterObj = (obj, ...allowedFields) => {
  const newObj = {}; //empty gor now obj
  Object.keys(obj).forEach((el) => {
    //create and chek that object have field and contain that walue in new object
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//Middleware that take id from ULR and put this id in code parameter whithout any request
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This rout is not for password updates. Please use /updateMe',
        400
      )
    );
  }

  // 2)Filter out unwanted filter names that are not allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) filterBody.photo = req.file.filename;

  // 3) Update user document

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    //we use x because we don't want update all the document
    new: true,
    runValidators: true,
  });
  //user.name = 'Ira';
  //await updatedUser.update();

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUsers = factory.createOne(User);
// Do NOT update password whith this route
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
