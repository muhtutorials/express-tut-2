const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  req.isAuth = false;

  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'secret-key');
  } catch (err) {
    err.statusCode = 401;
    return next();
  }

  if (!decodedToken) {
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
}