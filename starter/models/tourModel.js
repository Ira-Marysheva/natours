const { default: strictTransportSecurity } = require('helmet');
//= require('helmet/dist/types/middlewares/strict-transport-security');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

//create very simple schema
const toursSchema = new mongoose.Schema(
  {
    //object of schema option  (most basic way)
    name: {
      //object is schema type whith option
      type: String,
      required: [true, 'A tout muct have a name'], // it is colled validator
      //it is use for validate data
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      //validator from GitHub
      //validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `Difficulty is eiter: easy, medium, difficult`,
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be belove 5.0'],
      set: (val) => Math.round(val * 10) / 10, //перевілення (округлення результату)
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tout muct have a price'],
    },
    //CRETE CUSTOM VALIDATOR
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document cretion
          return val < this.price;
        },
        message: `Discount price ({VALUE}) should be below regular price`,
      },
      summary: {
        type: String,
        trim: true,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour muct have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), //time in miliseconds
      select: false, // we don't see this variable in Postman when do simple request if this set id false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    //it is (down) example how to do embeded documents
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //expect an array of number
      //it is coordinates of the point
      addres: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        addres: String,
        description: String,
        day: Number, //It is day when people go to this location
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    // review: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }], populating data
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//create index for prise field
//Індкс одного поля
//1 ---- ми сортуємо даний індекс за зростанням
//-1 ----ми сортуємо даний за спаданням
// є інші типи індексів наприклад, текст, геопросторові дані
//toursSchema.index({ price: 1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });
//Складений індекс
toursSchema.index({ price: 1, ratingsAverage: -1 });

//virtual properties
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //simple calculate duration on week
});

// Virtual populate
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE
//define middlevare: rus before . save() and .create() .insertMany()
toursSchema.pre('save', function (next) {
  //wort to curentle proses documents
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE
//toursSchema.pre('find', function (next) {
toursSchema.pre(/^find/, function (next) {
  //regular expresion
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//creting module
const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
