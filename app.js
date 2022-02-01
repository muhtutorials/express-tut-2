const path = require('path');
const { createServer } = require('http');

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		// directory specified in the cb function must be created manually otherwise an error is thrown
		cb(null, 'images')
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
		cb(null, uniqueSuffix + '-' + file.originalname)
	}
});
const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const app = express();
// websockets require this server setup
const httpServer = createServer(app);

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
	// fixes CORS error
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

app.use(multer({ storage: fileStorage, fileFilter }).single('image'));

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
	const { statusCode, message, data } = error;
	res.status(statusCode).json({ message, data });
});

mongoose.connect('mongodb+srv://igor:123321@cluster0.lcrui.mongodb.net/blog?retryWrites=true&w=majority')
	.then(() => {
		console.log('Connected to MongoDB server');
		httpServer.listen(8080);
		require('./socket').init(httpServer);
	})
	.catch(err => console.log(err));
