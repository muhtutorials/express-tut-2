const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

module.exports = {
  async createUser({ userInput }, req) {
    const { email, name, password } = userInput;

    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push(({ message: 'Email is invalid' }));
    }

    if (!validator.isLength(password, { min: 5 })) {
      errors.push(({ message: 'Password must be at least 5 characters long' }));
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push(({ message: 'User already exists' }));
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      // can be used made up code system
      error.code = 422;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });

    return { ...user._doc, _id: user._id.toString() };
  }
}