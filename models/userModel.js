const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: [true, 'Username must be unique'],
  },
  email: {
    type: String,
    unique: [true, 'This mail id is already registered'],
    required: [true, 'A user should provide his/her mail id'],
    lowercase: true,
    validate: [validator.isEmail, 'Give me a valid mail id'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Password shold be provided'],
    minlength: 8,
    select: false,
  },
  passwordConf: {
    type: String,
    required: [true, 'Re-enter the password'],
    // this will only work on save!!!
    validate: {
      validator: function (ele) {
        return ele === this.password;
      },
      message: 'The passwords do not match',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordChangedAt: {
    type: Date,
    defult: Date.now(),
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExp: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', function (next) {
  // if the document is not changed or if the document is new, Then return next()
  if (!this.isModified || this.isNew) return next();

  // set the passwordChanged at to date.now()
  // here the i sec difference is for incase the JWT Web token takes time to issue
  // the new token.
  this.passwordChandedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // if the password not modified then go on no need of this function
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // here the salt value i.e. 12 can be anything
  // default value is 10
  // Highere the value more time it will take but it will encrypt strongly
  this.passwordConf = undefined;
  // Becasue now we do not need this thing here
  // as it was only for validation
  next();
});

userSchema.pre(/^find/, function (next) {
  // here, this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // Here if the passwordChangeTime is less than JWTTimestamp, then the token
  //will be invalid
  return false;
  // This means the password is not changed after the creation of token
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExp = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
