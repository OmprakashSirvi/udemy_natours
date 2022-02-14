const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const AppError = require('../utils/appError');

// const signToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });

// this function creates the token and sends it as response
const createTokenAndSend = (user, statusCode, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // define a cookie..

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // If node evirnoment is prod then set the secure to true (it uses https)
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = 'true';
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'Success',
    token,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConf: req.body.passwordConf,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createTokenAndSend(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password exists..
  if (!email || !password) {
    return next(new AppError('Provide a email or password', 400));
  }

  // check if user exists or check if password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // If everything is ok then log in the user

  createTokenAndSend(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Get the token and check if it exists..
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log('Token : ', token);
  }

  if (!token)
    return next(new AppError('You are not permitted to access this', 401));
  // Verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // If verification success : Check if user exists..
  const currUser = await User.findById(decoded.id);
  if (!currUser) {
    return next(new AppError('User no longer exists', 401));
  }

  // Check if user changed password after jwt was issued
  if (currUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('the password was changed, login again to cotinue..', 401)
    );
  }

  // Finally granted access to the user..
  req.user = currUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // If the currUser does not have permission, then throw error
    if (!roles.includes(req.user.role))
      return next(new AppError('You dont have permission to do this..', 403));
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted mail id..
  const user = await User.findOne({ email: req.body.email });
  // If user mail id not found then, ..
  if (!user) return next(new AppError('User not found!', 404));

  // Geneater a random token  (not jwt token)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send that token to the user's mail id..
  // Creating the reset password url..
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}api/v1/users/resetToken/${resetToken}`;

  // Creating the context of the message in mail
  const message = `Forgot password? Submit a patch request with your new password
   and passwordConf to ${resetURL}.\nIf you did not forget your password, please
    ignore this message.`;

  // Used try catch here because we need to do more than just throwing error
  // eg we need to reset the "passwordRestToken" valuse in the database..
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token, valid for 10 mins',
      message,
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExp = undefined;
    // saving the changes in the database
    await user.save({ validateBeforeSave: false });

    // and finally throwing error
    return next(AppError('There was some trouble sending email'));
  }
  // If everything goes right then sending this response
  res.status(200).json({
    status: 'success',
    message: 'token is sent to your mail id, check your indbox',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token..
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    createPasswordResetToken: hashedToken,
    // Here checked if the passwordRsetExp is grater than current time or not
    passwordResetExp: { $gt: Date.now() },
    // If the token is expired then send a error message..
  });
  // check if there is a valid user, or if the token is not expired
  if (!user)
    return next(
      new AppError('No user found or the token is probably expired', 400)
    );

  // let the user set the password
  user.password = req.body.password;
  user.passwordConf = req.body.passwordConf;

  user.createPasswordResetToken = undefined;
  user.passwordResetExp = undefined;
  // update the password in the database..
  await user.save();
  // log in the user, send jwt
  createTokenAndSend(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection..
  const user = await User.findById(req.user.id).select('+password');
  // check if the posted password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return new AppError('Password is incorrect, check the password', 401);
  }
  // if password is correct, then update the password
  user.password = req.body.newPassword;
  user.passwordConf = req.body.confirmPassword;
  await user.save();
  // log in the user and send the JWT Web token

  createTokenAndSend(user, 200, res);
});
