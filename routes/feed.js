const express = require('express');

const {
  getPosts,
  createPost,
  getPost,
  updatePost,
  deletePost
} = require('../controllers/feed');
const { postValidator } = require('../validators/post');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/posts', isAuth, getPosts);

router.post('/posts', isAuth, postValidator(), createPost);

router.get('/posts/:postId', isAuth, getPost);

router.put('/posts/:postId', isAuth, postValidator(), updatePost);

router.delete('/posts/:postId', isAuth, deletePost);

module.exports = router;
