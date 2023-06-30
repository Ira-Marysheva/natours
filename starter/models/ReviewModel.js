//review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'a review must to have a text'],
      minlenght: [10, 'a review have text more than 10 symbols'],
    },
    rating: {
      type: Number,
      default: 4,
      required: [true, 'a revier have to required'],
      min: [1, 'a revier must be above 1.0'],
      max: [5, ' a revier must be belove 5.0'],
    },
    createdAt: {
      type: Date,
      validate: {
        validator: function (val) {
          return val === this.date.toISOString();
        },
        message: 'a data when wroute revier is ({VALUE})',
      },
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//create index for privent duplicate reviews to same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  //   justOne: true,
  // }).populate({
  //   path: 'tour',
  //   select: 'name photo',
  //   justOne: true,
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats.length);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};
reviewSchema.post('save', async function () {
  //this points to current review
  //constructor - це модель яка створила цей документ
  // по суті це  this.constructor дорівнює Review в даному випадку
  await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  //console.log(this.r.tour);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.model.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
