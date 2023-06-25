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
  console.log(distance, lng, lat, unit);

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

//create a checkBody middlevare
//Check if body contains the name and price property
//if not send back 400(bad request)
//add it to the post handler stack

//it is my own middlevare
// exports.checkBody = (req, res, next) => {
//   // for (let i = 0; i < tours.length; i++) {
//   //   if (
//   //     typeof tours[i].name === 'undefined' &&
//   //     typeof tours[i].price === 'undefined'
//   //   ) {
//   //     return res.status(404).json({
//   //       status: 'fail',
//   //       message: 'bad request',
//   //     });
//   //   }
//   // }

//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'bad request',
//     });
//   }
//   next();
// };

//BUILD QUERY

//1 A)Filtering
// const queryObj = { ...req.query }; //simply create new object
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);

// 1 way to filtering data
// const query = Tour.find({
//   duration: 5,
//   difficulty: 'easy',
// });

// //2 way to filtering data
// const query = Tour.find()
//   .where('duration')
//   .equals(5)
//   .where('difficulty')
//   .equals('easy');

//1 B)Advanced filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// console.log(JSON.parse(queryStr));

//reade file grom mongoose
//Tour.find return query object and this 'saving' variable we kan use and chaining more methods from query class
// let query = Tour.find(JSON.parse(queryStr));

//2)Sorting
//min--->max
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   console.log(sortBy);
//   query = query.sort(req.query.sort);
// } else {
//   query = query.sort('-createdAt');
// }

//3)Filter limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields); //projecting operaning
// } else {
//   query = query.select('-__v');
// }

//4)Pagination
// const page = +req.query.pagge || 1;
// const limit = +req.query.limit || 100;
// const skip = (page - 1) * limit;
// //page=2&limit=10 ==>1-10 for page #1 and 11-20 for page #2
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   //here we crete new method for pagination thet return number of
//   const numTours = await Tour.countDocuments();
//   //if this statment will work we automatically will go to main chach bloc and return error message
//   if (skip >= numTours) throw new Error('This page does not exist');
// }

//new way to create documents

//simple for us(different: call from new document)
// const newTour = new Tour({});
// newTour.save();

//more better but work as previous(call method right this module)
//const newTour = await Tour.create(req.body);

//console.log(req.body);
// const newID = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newID }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/starter/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours)

//function that we rerouting in factory
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tours = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: false, //true,
//   });

//   if (!tours) {
//     //jumping straight to ErrorHandler middlevare
//     return next(new AppError('No tour found with that ID'), 404);
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tours,
//     },
//   });
// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: 'Invalid data sent!!!!',
//   });
// }
//});

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tours = Tour.findByIdAndDelete(req.params.id);
//   if (!tours) {
//     //jumping straight to ErrorHandler middlevare
//     return next(new AppError('No tour found with that ID'), 404);
//   }
//   res.status(204).json({
//     status: 'success',
//     message: null,
//   });

//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: 'Bad request ',
//   //   });
//   //   console.log(err.message);
//   // }
// });

// exports.createTours = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });
//   try {
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: 'Invalid data sent!!!!',
//     });
//   }
// });
//   );
// };

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (+req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tours = await Tour.findById(req.params.id).populate('reviews');

//   // Tour.findById({_id: req.params.id})

//   if (!tours) {
//     //jumping straight to ErrorHandler middlevare
//     return next(new AppError('No tour found with that ID'), 404);
//   }

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
//   // } catch (err) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: err.message,
//   //   });
//   // }
// });
