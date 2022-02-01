const { body } = require('express-validator');

exports.statusValidator = () => body('status').trim().not().isEmpty();
