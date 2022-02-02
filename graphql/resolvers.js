const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = {
  createUser: async function(args, req) {
    const { email, name, password } = args.userInput;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User already exists.');
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });

    return { ...user._doc, _id: user._id.toString() };
  }
}