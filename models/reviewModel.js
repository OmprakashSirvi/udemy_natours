const mongoose = require('mongoose');
const Tour = require('./tourModels');

/**
 * Creating our reviewSchema (collection)
 */

const reviewSchema = new mongoose.Schema(
  {
    refToTour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: ['true', 'Gimme a ref To tour'],
    },
    refToUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: ['true', 'Gimme who wrote this..'],
    },
    review: {
      type: String,
      trim: true,
      required: ['true', 'Write Somwthing, cause its called review'],
    },
    rating: {
      type: Number,
      default: 4.9,
      min: [0.1, 'Rating must be above 0.1'],
      max: [5, 'rating cannot be above 5'],
      // required: ['true', 'Give a rating or else i will give it.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  // This is to show all the virual properties in our output
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ refToTour: 1, refToUser: 1 }, { unique: true });
/**
 * Populating our review with users
 * NOTE: we did not populate tours as it is not necessary
 */
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'refToUser',
    select: 'name photo',
  });
  next();
});

/**
 *
 * @param {calcAverageRatings} tourId
 *
 * Here we calculate the average of the ratings and update it to the tour
 * the argument provided here is the 'tourId' which we want to update the two fields
 *
 */

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { refToTour: tourId },
    },
    {
      $group: {
        _id: '$refToTour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  if (stats.length === 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
    return;
  }
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.refToTour);
});

/**
 * Here we used a trick..
 * We cannot use post middleware with 'findByIdAndUpdate' and 'findByIdAndDelete'
 * so we use a 'pre' middleware and then passed 'this' object
 *
 * InShort we cannot use : this.findOne() in post middleware
 * because the query does not exit and it has already been excecuted
 *
 * NOTE : Here i had to chain clone() method because without that,
 *        there would be an error as i would be excecuting a query twice which is
 *        not allowed
 */

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne().clone();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.refToTour);
});

/**
 * FInally exporting our Model
 */

module.exports = mongoose.model('Review', reviewSchema);
