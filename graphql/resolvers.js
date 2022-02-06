const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/user');
const Post = require('../models/post');
const { deleteImage } = require('../utils');
const {use} = require("express/lib/router");

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
  },

  async login({ email, password }) {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User with this email could not be found.');
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Wrong password.');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({
        userId: user._id.toString(),
        email: user.email
      }, 'secret-key',
      { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() }
  },

  async createPost({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const { title, content, imageUrl } = postInput;

    const errors = [];

    if (!validator.isLength(title, { min: 5 })) {
      errors.push(({ message: 'Title must be at least 5 characters long' }));
    }

    if (!validator.isLength(content, { min: 5, max: 500 })) {
      errors.push(({ message: 'Content must be between 5 and 500 characters long' }));
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      // can be used a made up code system
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;      
    }

    const post = await Post.create({ title, content, imageUrl, creator: user });
    user.posts.push(post);
    await user.save();

    return { 
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };    
  },

  async postList({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    if (!page) page = 1;
    const perPage = 2;

    const posts = await Post.find().populate('creator')
      .skip((page - 1) * perPage ).limit(perPage).sort({ createdAt: -1 });
    const totalPosts = await Post.find().countDocuments();

    return {
      posts: posts.map(post => ({
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      })),
      totalPosts
    };
  },

  async postDetail({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post not found');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },

  async updatePost({ postId, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post not found');
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }

    const { title, content, imageUrl } = postInput;

    const errors = [];

    if (!validator.isLength(title, { min: 5 })) {
      errors.push(({ message: 'Title must be at least 5 characters long' }));
    }

    if (!validator.isLength(content, { min: 5, max: 500 })) {
      errors.push(({ message: 'Content must be between 5 and 500 characters long' }));
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title = title;
    post.content = content;

    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    }
  },

  async deletePost({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post not found');
      error.code = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }

    deleteImage(post.imageUrl);

    await Post.findByIdAndDelete(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    return true;
  },

  async getUser(args, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    return user;
  },

  async updateStatus({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    user.status = status;
    await user.save();

    return user;
  }
}