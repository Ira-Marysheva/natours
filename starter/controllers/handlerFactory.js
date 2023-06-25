const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('..//utils/apiFertures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      //jumping straight to ErrorHandler middlevare
      return next(new AppError('No document found with that ID'), 404);
    }
    res.status(204).json({
      status: 'success',
      result: doc.length,
      message: null,
    });
  });

exports.updateOne = (Module) =>
  catchAsync(async (req, res, next) => {
    const doc = await Module.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false, //true,
    });

    if (!doc) {
      //jumping straight to ErrorHandler middlevare
      return next(new AppError('No found  document with that ID'), 404);
    }

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Module) =>
  catchAsync(async (req, res, next) => {
    const doc = await Module.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Module, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Module.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      //jumping straight to ErrorHandler middlevare
      return next(new AppError('No document found with that ID'), 404);
    }

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //API features ---filtering
    console.log(req.query);
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .limitFields()
      .paging()
      .sort();
    const doc = await features.query;
    // const doc = await features.query.explain();
    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
