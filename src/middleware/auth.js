const jwt = require('jsonwebtoken');

const JWT_SECRET = 'civicflow_super_secret_key_123!';
const JWT_EXPIRES_IN = '24h';

function authenticateJWT(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  authenticateJWT,
  requireRole,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
