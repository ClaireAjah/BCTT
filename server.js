require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const apiRouter = require('./src/routes/api');
const { errorHandler } = require('./src/middleware/error');
const { JWT_SECRET } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login.html');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'doctor' || decoded.role === 'admin') {
      return res.redirect('/admin.html');
    }
    return res.redirect('/dashboard.html');
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login.html');
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
