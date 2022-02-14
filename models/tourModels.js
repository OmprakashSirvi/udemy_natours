const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');
// const catchAsync = require('../utils/catchAsync');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name..!!'],
      unique: true,
      trim: true,
      maxlength: [40, 'Name is too long'],
      minlength: [8, 'Name too short'],
      // validate: [validator.isAlpha, 'tour name must only contain charecters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Maximum Grop size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty leve;'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty should be either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1'],
      max: [5, 'Rating must not be greater than 5'],
      set: (val) => Math.round((val * 10) / 10),
      /**
       * We have to do this as Math.round does this :
       * Math.round(2.66666) gives : 3
       * so we do 2.66666 * 10 = 26.6666 which gives 27,
       * Now divide it by 10 and we get our required value
       */
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'The tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this can only be used when creating new tour, updating tour
          // does not work here
          return val < this.price;
        },
        message: 'Discount value ({VALUE}) greater than price ',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a basic summary about it!'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have its cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    }, // This is a special type.
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
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
        address: String,
        description: String,
        day: Number,
      },
    ],
    // // THIS IS FOR EMBEDDING..
    // guides: Array,
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

/// DOCUMENT MIDDLEWARE
/// RUNS BEFORE SAVE AND CREATE COMMAND
/// I.E. .save() & .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // IMPLEMENTING EMBEDDING..
// // this is to get the guides from the id provided
// tourSchema.pre('save', async function (next) {
//   // guidesPromise will return an array of unhandled promises
//   const guidesPromise = this.guides.map(async (id) => {
//     const guide = await User.findById(id);
//     return guide;
//   });
//   // here handling all the unhandled promises
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });
// tourSchema.pre('save', (next) => {
//   console.log('Will save document');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//// QUERY MIDDLEWARE
// Here i use regex, so this will work on : find, findOne, findOneAndDelete
// findOneAndReplace, findOneAndRemove..
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  // Another method :
  // tourSchema.pre('findOne', function (next) {
  //   this.find({ secretTour: { $ne: true } });
  //   next();
  // });
  // Instead Of this we use regex as explained above

  // Populating the guides
  this.populate({
    path: 'guides',
    // Filtering out unnecessary data
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(`This query took ${Date.now() - this.start} ms`);
  next();
});

// Created a virtual propery
// Virtual properties are those which can be derived from our data and there is no
// need to store these in our data, so it saves space
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate..
tourSchema.virtual('reviews', {
  ref: 'Review',
  // name of the field in the other model
  foreignField: 'refToTour',
  // where that field is actually stored in this model
  localField: '_id',
});

/// AGGREGATIO MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // console.log(this);
//   next();
// });

module.exports = mongoose.model('Tour', tourSchema);
