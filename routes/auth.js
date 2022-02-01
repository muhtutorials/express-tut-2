const express = require('express');

const { signup, login, getStatus, updateStatus } = require('../controllers/auth');
const { userValidator } = require('../validators/user');
const { statusValidator } = require('../validators/status');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put('/signup', userValidator(), signup);

router.post('/login', login);

router.get('/status', isAuth, getStatus);

router.post('/status', isAuth, statusValidator(), updateStatus);

module.exports = router;
