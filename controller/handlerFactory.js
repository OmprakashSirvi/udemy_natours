const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

/**
 *
 * @param {deleteOne} Model
 * Deletes the document from database,
 * @returns Error if the document is not found
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return new AppError('There is nothing to delete here', 404);

    res.status(204).json({
      status: 'success',
      message: 'Your document is succesfully deleted',
    });
  });

/**
 *
 * @param {updateOne} Model
 * Updates the given document with the parameters provided
 * @returns Error if the document is not found
 */
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError('There is nothing to update here', 404));

    res.status(200).json({
      status: 'success',
      message: 'Your documnet is updated',
      data: { data: doc },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      message: 'New document created',
      data: { newDoc },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) return next(new AppError('Nothing found with that id.. !', 404));

    res.status(200).json({
      status: 'success',
      message: 'Found your requested document',
      data: { doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Building the object by adding all the features here
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .fieldLimit()
      .pagintate();
    // Now awaiting the result of our query
    const doc = await features.query;
    // console.log(doc[0].durationWeeks);

    // Sending data
    res.status(200).json({
      status: 'success',
      message: 'Found all your requested documents..!',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
