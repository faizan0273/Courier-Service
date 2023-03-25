const jwt = require('jsonwebtoken');

const riderAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header not found' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, 'rider-secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token1' });
    }

    req.riderId = decoded.riderId;
    next();
  });
};

module.exports = riderAuthMiddleware;