const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.addUser = factory.createOne(User);

const filterObj = (obj, ...allowedFields) => {
  // created a new object..
  const newObj = {};
  // if the "obj" contains allowedFields then this will be stored to the "newObj"
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  // return the newObj
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // if the user tries to update his password throw error
  if (req.body.password || req.body.passwordConf) {
    return next(new AppError('The password cannot be updated here', 400));
  }
  // Filter out unwanted field names..
  // basically which are not allowed to be updated..
  const filteredBody = filterObj(req.body, 'name', 'email');
  // take the documents and update the user..

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'Your acount has been deactivated',
    data: null,
  });
});

exports.getUser = factory.getOne(User);
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet been defined',
//   });
// };

exports.updateUser = factory.updateOne(User);

exports.delUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
