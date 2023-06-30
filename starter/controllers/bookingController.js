const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const Booking = require('./../models/bookingModel');
const factory = require('./handlerFactory');

exports.getCheckOutSessing = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(req.user.id);
  
  //2)Create chekout session
  const session = await stripe.checkout.sessions.create({
    //information sbout session
    payment_method_types: ['card'],
    success_url:  `${req.protocol}://${req.get('host')}/.netlify/functions/api/my-tours/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    cancel_url:`${req.protocol}://${req.get('host')}/.netlify/functions/api/tour/${tour.slug}`,

    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'subscription',
    //information about produpt
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`./img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
  });
  // 3) Create sesion as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// function for create new booking in database

exports.crateBokingCheout = catchAsync(async (req, res, next) => {
  // This is only TEMPRORALY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  console.gog(`req.originalUrl.split('?')[0])`)
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
