const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
  },
  email: {
    type: String,
    required: [true, 'User must have a email'],
    unique: true,
    //not validatot, it is simple trancform yhe email into lowercase
    lowercase: true,
    //Custom validatior
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    //chek on uniq new user
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //It will work only on CREATE an  d SAVE!!!!
      validator: function (el) {
        //this function can only create true|false value
        return el === this.password;
      },
      message: 'Password are not the same!',
    },
  },
  //FIELD FOR OUR SCHEMA FOR THE DATE WHERE THE PASSWORD HAS BEEN CHANGED
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, //security measure(like 10min for reset you password)
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
//ENCRYPTION
userSchema.pre('save', async function (next) {
  //check change when the password  was actually modified
  if (!this.isModified('password')) return next();
  //plase to encrypted||hash password fild
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//this middleware to apply to query thst starts with find
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } }); // acrive shoud not be active
  next();
});

//instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//instance method
userSchema.methods.changedPasswordAfter = async function (JWTtimestamp) {
  //JWTtimestamp - is say when the token was issued
  //false - user NOT cange own password
  // if (this.passwordChangedAt) {
  //   console.log('It is text from changedPasswordAfter');
  //   const changedTimestamp = parseInt(
  //     this.passwordChangedAt.getTime() / 1000,
  //     10
  //   );
  //   const JWTtimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  //   console.log(JWTtimestamp === changedTimestamp);
  //   return JWTtimestamp === changedTimestamp; //true means that was changed
  // }
  // //False means NOT changed password
  // return false;
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTtimestamp < changedTimestamp; //true means that was changed
  }

  // False means NOT changed
  return false;
};
//instance method for generate random token
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

//create module
const User = mongoose.model('User', userSchema);

//export module
module.exports = User;
