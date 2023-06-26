const multer = require(`multer`);
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFertures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

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

//midelvare
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  //1)Civer image

  //image resizing
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //  2/3
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`starter/public/img/tours/${req.body.imageCover}`);

  // 2) Image
  req.body.images = []; // create empty array
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // access to the current file
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333) //  2/3
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`starter/public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsaverage,price';
  req.query.fields = 'name,difficulty,ratingsAverage,price,summary';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTours = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //_id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // +1 for num counter for ALL go throught this point
        avgRating: { $avg: '$ratingsAverage' },
        numRating: { $sum: '$ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrise: { $min: '$price' },
        maxPrise: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //here is name of the filds
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: 'Bad request ',
  //   });
  //   console.log(err.message);
  // }
});

// /tours-within/:distance/center/:latlng/:unit
//tours-within/233/center/40.587767, -74.137753/unit/mi
exports.getToursWithin = async function (req, res, next) {
  const { distance, latlng, unit } = req.params; //це приклад реструкторизації
  const [lat, lng] = latlng.split(','); //деструктиризація

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6379.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and lnggitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,

    data: {
      data: tours,
    },
  });
};

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; //це приклад реструкторизації
  const [lat, lng] = latlng.split(','); //деструктиризація

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and lnggitude in the format lat,lng.',
        400
      )
    );
  }
  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distance,
    },
  });
});
