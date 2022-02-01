const { body } = require('express-validator');

exports.postValidator = () => {
  return [
    body('title', 'The title must be at least 5 characters long.')
      .isLength({ min: 5 })
      .trim(),
    body('content', 'Content must be between 5 and 500 characters long.')
      .isLength({ min: 5, max: 500 })
      .trim()
  ]
};
