const { body } = require('express-validator');

const User = require('../models/user');

exports.userValidator = () => {
  return [
    body('email', 'Please enter a valid email.')
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value })
          .then(user => {
            if (user) return Promise.reject('Email already exists.');
          })
      })
      .normalizeEmail(),
    body('password', 'Password must be at least 5 characters long.')
      .isLength({ min: 5 })
      .trim(),
    body('name', 'Name must be at least 5 characters long.')
      .not()
      .isEmpty()
      .trim()
  ]
};
