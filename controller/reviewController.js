const Review = require('../models/reviewModel');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.refToTour) req.body.refToTour = req.params.tourId;
  if (!req.body.refToUser) req.body.refToUser = req.user.id;

  next();
};

exports.createReview = factory.createOne(Review);

exports.getAllReviews = catchAsync(async (req, res) => {
  // creating filter object just to be safe..
  // cause we have two routes that lead to here
  // 1 : /reviews
  // 2: /tours/:tourId/reviews
  let filter = {};
  if (req.params.tourId) filter = { refToTour: req.params.tourId };
  // default condition
  // else filter = { refToUser: req.user.id };

  const reviews = await Review.find(filter);
  res.status(200).json({
    status: 'success',
    rews: reviews.length,
    data: { reviews },
  });
});

exports.getReview = factory.getOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
